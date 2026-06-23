export const REGISTER = "REGISTER";
export const FAILED = "FAILED";

export const newUserAction = (nome, cognome, email, password) => {
  return async (dispatch) =>
    await fetch("http://127.0.0.1:8000", {
      method: "POST",
      body: JSON.stringify({ nome, cognome, email, password }),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errorePayload) => {
            const messaggioErrore =
              errorePayload.messaggio || "Errore nella registrazione";
            throw new Error(messaggioErrore);
          });
        }
        return res.json();
      })
      .then((data) => {
        dispatch({
          type: REGISTER,
          payload: data,
        });
      })
      .catch((err) => {
        dispatch({
          type: FAILED,
          payload: err.messaggio,
        });
        console.log(err);
      });
};
