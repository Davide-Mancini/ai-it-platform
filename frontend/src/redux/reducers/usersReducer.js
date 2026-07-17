import {
  USERS_LOADING, USERS_SUCCESS, ROLES_SUCCESS, USER_UPDATED,
  USERS_BROWSE_LOADING, USERS_BROWSE_SUCCESS,
} from "../actions/usersActions";

const initialState = {
  list: [],
  roles: [],
  loading: false,
  // Pagina corrente per la tabella di UsersPage (ricerca + paginazione server-side)
  browse: { items: [], total: 0, page: 1, pageSize: 25, loading: false },
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
        browse: {
          ...state.browse,
          items: state.browse.items.map(u => u.id === action.payload.id ? action.payload : u),
        },
      };

    case USERS_BROWSE_LOADING:
      return { ...state, browse: { ...state.browse, loading: true } };

    case USERS_BROWSE_SUCCESS:
      return {
        ...state,
        browse: {
          items: action.payload.items,
          total: action.payload.total,
          page: action.payload.page,
          pageSize: action.payload.page_size,
          loading: false,
        },
      };

    default:
      return state;
  }
};
