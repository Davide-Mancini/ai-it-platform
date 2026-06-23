import { newUserReducer } from "../reducers/newUserReducer";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

const combineReducer = combineReducers({
  newUser: newUserReducer,
});

const store = configureStore({
  reducer: combineReducer,
});
export default store;
