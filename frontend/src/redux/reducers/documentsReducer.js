import { DOCUMENTS_LOADING, DOCUMENTS_SUCCESS, DOCUMENT_UPDATE, DOCUMENT_REMOVE, DOCUMENT_ADDED } from "../actions/documentsActions";

const initialState = {
  list: [],
  loading: false,
};

export const documentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case DOCUMENTS_LOADING:
      return { ...state, loading: true };

    case DOCUMENTS_SUCCESS:
      return { ...state, loading: false, list: action.payload };

    case DOCUMENT_UPDATE:
      return {
        ...state,
        list: state.list.map(d => d.id === action.payload.id ? action.payload : d),
      };

    case DOCUMENT_REMOVE:
      return {
        ...state,
        list: state.list.filter(d => d.id !== action.payload),
      };

    case DOCUMENT_ADDED:
      return {
        ...state,
        list: [action.payload, ...state.list],
      };

    default:
      return state;
  }
};
