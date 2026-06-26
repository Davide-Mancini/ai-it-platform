import { DOCUMENTS_LOADING, DOCUMENTS_SUCCESS, DOCUMENT_UPDATE, DOCUMENT_REMOVE } from "../actions/documentsActions";

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

    default:
      return state;
  }
};
