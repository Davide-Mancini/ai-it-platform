import { FAILED, REGISTER } from "../actions/newUserAction";
const initialState = {
  registrato: false,
  user: null,
  error: null,
};

export const newUserReducer = (state = initialState, action) => {
  switch (action.type) {
    case REGISTER:
      return {
        ...state,
        registrato: true,
        user: action.payload,
      };
    case FAILED:
      return {
        ...state,
        registrato: false,
        error: action.payload,
      };
    default:
      return state;
  }
};
