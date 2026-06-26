import {
  TASKS_LOADING,
  TASKS_SUCCESS,
  TASK_ADD,
  TASK_STATUS_UPDATE,
} from "../actions/tasksActions";

const initialState = {
  list: [],
  loading: false,
};

export const tasksReducer = (state = initialState, action) => {
  switch (action.type) {
    case TASKS_LOADING:
      return { ...state, loading: true };

    case TASKS_SUCCESS:
      return { ...state, loading: false, list: action.payload };

    case TASK_ADD:
      return { ...state, list: [...state.list, action.payload] };

    case TASK_STATUS_UPDATE:
      return {
        ...state,
        list: state.list.map(t =>
          t.id === action.payload.taskId ? { ...t, status: action.payload.status } : t
        ),
      };

    default:
      return state;
  }
};
