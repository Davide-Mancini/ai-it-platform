import {
  CUSTOMERS_LOADING, CUSTOMERS_SUCCESS, CUSTOMER_ADDED, CUSTOMER_UPDATED, CUSTOMER_REMOVED,
} from "../actions/customersActions";

const initialState = {
  list: [],
  loading: false,
};

export const customersReducer = (state = initialState, action) => {
  switch (action.type) {
    case CUSTOMERS_LOADING:
      return { ...state, loading: true };

    case CUSTOMERS_SUCCESS:
      return { ...state, loading: false, list: action.payload };

    case CUSTOMER_ADDED:
      return { ...state, list: [...state.list, action.payload] };

    case CUSTOMER_UPDATED:
      return {
        ...state,
        list: state.list.map(c => c.id === action.payload.id ? action.payload : c),
      };

    case CUSTOMER_REMOVED:
      return {
        ...state,
        list: state.list.filter(c => c.id !== action.payload),
      };

    default:
      return state;
  }
};
