import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { newUserReducer }       from "../reducers/newUserReducer";
import { proceduresReducer }    from "../reducers/proceduresReducer";
import { tasksReducer }         from "../reducers/tasksReducer";
import { documentsReducer }     from "../reducers/documentsReducer";
import { usersReducer }         from "../reducers/usersReducer";
import { notificationsReducer } from "../reducers/notificationsReducer";
import { customersReducer }     from "../reducers/customersReducer";

const rootReducer = combineReducers({
  newUser:       newUserReducer,
  procedures:    proceduresReducer,
  tasks:         tasksReducer,
  documents:     documentsReducer,
  users:         usersReducer,
  notifications: notificationsReducer,
  customers:     customersReducer,
});

const store = configureStore({ reducer: rootReducer });

export default store;
