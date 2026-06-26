import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { newUserReducer }    from "../reducers/newUserReducer";
import { proceduresReducer } from "../reducers/proceduresReducer";
import { tasksReducer }      from "../reducers/tasksReducer";
import { documentsReducer }  from "../reducers/documentsReducer";
import { usersReducer }      from "../reducers/usersReducer";

const rootReducer = combineReducers({
  newUser:    newUserReducer,
  procedures: proceduresReducer,
  tasks:      tasksReducer,
  documents:  documentsReducer,
  users:      usersReducer,
});

const store = configureStore({ reducer: rootReducer });

export default store;
