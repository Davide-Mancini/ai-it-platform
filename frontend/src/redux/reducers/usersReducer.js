import { USERS_LOADING, USERS_SUCCESS, ROLES_SUCCESS, USER_UPDATED } from "../actions/usersActions";

const initialState = {
  list: [],
  roles: [],
  loading: false,
};

export const usersReducer = (state = initialState, action) => {
  switch (action.type) {
    case USERS_LOADING:
      return { ...state, loading: true };

    case USERS_SUCCESS:
      return { ...state, loading: false, list: action.payload };

    case ROLES_SUCCESS:
      return { ...state, roles: action.payload };

    case USER_UPDATED:
      return {
        ...state,
        list: state.list.map(u => u.id === action.payload.id ? action.payload : u),
      };

    default:
      return state;
  }
};
