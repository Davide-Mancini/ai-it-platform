import {
  PROCEDURES_LOADING,
  PROCEDURES_SUCCESS,
  PROCEDURES_ERROR,
  PROCEDURE_ADD,
  PROCEDURE_UPDATE,
  PROCEDURE_REMOVE,
  STEPS_LOADING,
  STEPS_SUCCESS,
  STEP_TOGGLE_START,
  STEP_TOGGLE_SUCCESS,
  STEP_TOGGLE_DONE,
  PROCEDURES_RESET_STEPS,
} from "../actions/proceduresActions";

const initialState = {
  list: [],
  loading: false,
  error: null,
  // steps indicizzati per procedureId — { [id]: StepArray }
  stepsById: {},
  loadingSteps: false,
  togglingStepId: null,
};

export const proceduresReducer = (state = initialState, action) => {
  switch (action.type) {
    case PROCEDURES_LOADING:
      return { ...state, loading: true, error: null };

    case PROCEDURES_SUCCESS:
      return { ...state, loading: false, list: action.payload };

    case PROCEDURES_ERROR:
      return { ...state, loading: false, error: action.payload };

    case PROCEDURE_ADD:
      return { ...state, list: [action.payload, ...state.list] };

    case PROCEDURE_UPDATE:
      return {
        ...state,
        list: state.list.map(p => p.id === action.payload.id ? action.payload : p),
      };

    case PROCEDURE_REMOVE:
      return {
        ...state,
        list: state.list.filter(p => p.id !== action.payload),
      };

    case STEPS_LOADING:
      return { ...state, loadingSteps: true };

    case STEPS_SUCCESS:
      return {
        ...state,
        loadingSteps: false,
        stepsById: {
          ...state.stepsById,
          [action.payload.procedureId]: action.payload.steps,
        },
      };

    case STEP_TOGGLE_START:
      return { ...state, togglingStepId: action.payload };

    case STEP_TOGGLE_SUCCESS: {
      const { step, procedureId } = action.payload;
      const prev = state.stepsById[procedureId] || [];
      return {
        ...state,
        togglingStepId: null,
        stepsById: {
          ...state.stepsById,
          [procedureId]: prev.map(s => s.id === step.id ? step : s),
        },
      };
    }

    case STEP_TOGGLE_DONE:
      return { ...state, togglingStepId: null };

    case PROCEDURES_RESET_STEPS:
      return { ...state, stepsById: {} };

    default:
      return state;
  }
};
