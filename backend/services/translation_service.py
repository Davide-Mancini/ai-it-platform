from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from google.genai import types
import models
import schemas
from services.gemini_service import ai_client, language_display_name

BATCH_SIZE = 25


def _upsert_procedure_translation(db: Session, procedure_id, language: str, title: str, description: str | None) -> models.ProcedureTranslation:
    stmt = pg_insert(models.ProcedureTranslation).values(
        procedure_id=procedure_id,
        language=language,
        title=title,
        description=description,
    ).on_conflict_do_nothing(index_elements=["procedure_id", "language"])
    db.execute(stmt)
    db.commit()
    return (
        db.query(models.ProcedureTranslation)
        .filter_by(procedure_id=procedure_id, language=language)
        .first()
    )


def _upsert_step_translation(db: Session, step_id, language: str, title: str, description: str) -> models.ProcedureStepTranslation:
    stmt = pg_insert(models.ProcedureStepTranslation).values(
        step_id=step_id,
        language=language,
        title=title,
        description=description,
    ).on_conflict_do_nothing(index_elements=["step_id", "language"])
    db.execute(stmt)
    db.commit()
    return (
        db.query(models.ProcedureStepTranslation)
        .filter_by(step_id=step_id, language=language)
        .first()
    )


def _translate_batch(items: list[tuple[int, str, str | None]], target_language: str) -> list:
    """items: list of (index, title, description). Returns [] on any failure or malformed response."""
    if not items:
        return []
    lang_name = language_display_name(target_language)
    lines = "\n".join(
        f"### index={idx}\nTITOLO: {title}\nDESCRIZIONE: {description or ''}"
        for idx, title, description in items
    )
    prompt = (
        f"Traduci in {lang_name} SOLO il testo naturale dei seguenti elementi (titolo e descrizione). "
        "Non tradurre comandi, percorsi di file, nomi di variabili, codice o termini tecnici non traducibili: "
        "lasciali invariati. Mantieni per ogni elemento esattamente lo stesso valore di 'index' ricevuto in input, "
        "senza aggiungere o rimuovere elementi.\n\n"
        f"{lines}"
    )
    try:
        response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schemas.BatchProcedureTranslationResponse,
            ),
        )
        parsed = schemas.BatchProcedureTranslationResponse.model_validate_json(response.text)
        return parsed.items
    except Exception:
        return []


def _has_valid_indices(translated: list, chunk_len: int) -> bool:
    """Gemini is asked to echo back each item's original index; nothing enforces
    it stays in range or stays unique. An out-of-range index would raise
    IndexError on chunk[t.index], and a duplicated one would silently overwrite
    one item's translation with another's."""
    indices = [t.index for t in translated]
    return all(0 <= i < chunk_len for i in indices) and len(set(indices)) == len(indices)


def get_translated_procedures(db: Session, procedures: list, target_lang: str) -> dict:
    """Returns {procedure.id: (title, description)}, translating cache-missing procedures in batches."""
    result = {}
    to_translate = []
    for proc in procedures:
        if proc.language == target_lang:
            result[proc.id] = (proc.title, proc.description)
            continue
        cached = (
            db.query(models.ProcedureTranslation)
            .filter_by(procedure_id=proc.id, language=target_lang)
            .first()
        )
        if cached:
            result[proc.id] = (cached.title, cached.description)
        else:
            to_translate.append(proc)

    for start in range(0, len(to_translate), BATCH_SIZE):
        chunk = to_translate[start:start + BATCH_SIZE]
        items = [(i, p.title, p.description) for i, p in enumerate(chunk)]
        translated = _translate_batch(items, target_lang)
        if len(translated) != len(chunk) or not _has_valid_indices(translated, len(chunk)):
            # Mismatch or failure: show source text now, retry translation on a future request.
            for p in chunk:
                result[p.id] = (p.title, p.description)
            continue
        for t in translated:
            proc = chunk[t.index]
            saved = _upsert_procedure_translation(db, proc.id, target_lang, t.title, t.description)
            result[proc.id] = (saved.title, saved.description)

    return result


def get_translated_steps(db: Session, steps: list, target_lang: str) -> dict:
    """Returns {step.id: (title, description)} for steps not already cached in target_lang.
    Caller is expected to only invoke this when target_lang differs from the procedure's source language."""
    result = {}
    to_translate = []
    for step in steps:
        cached = (
            db.query(models.ProcedureStepTranslation)
            .filter_by(step_id=step.id, language=target_lang)
            .first()
        )
        if cached:
            result[step.id] = (cached.title, cached.description)
        else:
            to_translate.append(step)

    for start in range(0, len(to_translate), BATCH_SIZE):
        chunk = to_translate[start:start + BATCH_SIZE]
        items = [(i, s.title, s.description) for i, s in enumerate(chunk)]
        translated = _translate_batch(items, target_lang)
        if len(translated) != len(chunk) or not _has_valid_indices(translated, len(chunk)):
            for s in chunk:
                result[s.id] = (s.title, s.description)
            continue
        for t in translated:
            step = chunk[t.index]
            saved = _upsert_step_translation(db, step.id, target_lang, t.title, t.description)
            result[step.id] = (saved.title, saved.description)

    return result


def _upsert_task_translation(db: Session, task_id, language: str, title: str) -> models.TaskTranslation:
    stmt = pg_insert(models.TaskTranslation).values(
        task_id=task_id,
        language=language,
        title=title,
    ).on_conflict_do_nothing(index_elements=["task_id", "language"])
    db.execute(stmt)
    db.commit()
    return (
        db.query(models.TaskTranslation)
        .filter_by(task_id=task_id, language=language)
        .first()
    )


def get_translated_tasks(db: Session, tasks: list, target_lang: str) -> dict:
    """Returns {task.id: title}. Task has no own language column, so the parent
    Procedure's language is used as the source language (same assumption already
    made for ProcedureStep)."""
    result = {}
    to_translate = []
    for task in tasks:
        source_lang = task.procedure.language if task.procedure else "it"
        if source_lang == target_lang:
            result[task.id] = task.title
            continue
        cached = (
            db.query(models.TaskTranslation)
            .filter_by(task_id=task.id, language=target_lang)
            .first()
        )
        if cached:
            result[task.id] = cached.title
        else:
            to_translate.append(task)

    for start in range(0, len(to_translate), BATCH_SIZE):
        chunk = to_translate[start:start + BATCH_SIZE]
        items = [(i, t.title, "") for i, t in enumerate(chunk)]
        translated = _translate_batch(items, target_lang)
        if len(translated) != len(chunk) or not _has_valid_indices(translated, len(chunk)):
            for t in chunk:
                result[t.id] = t.title
            continue
        for tr in translated:
            task = chunk[tr.index]
            saved = _upsert_task_translation(db, task.id, target_lang, tr.title)
            result[task.id] = saved.title

    return result


def invalidate_procedure_translations(db: Session, procedure_id):
    db.query(models.ProcedureTranslation).filter_by(procedure_id=procedure_id).delete()


def invalidate_step_translations(db: Session, step_id):
    db.query(models.ProcedureStepTranslation).filter_by(step_id=step_id).delete()
