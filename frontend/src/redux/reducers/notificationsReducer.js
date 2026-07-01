import {
  NOTIFICATIONS_SUCCESS,
  NOTIFICATION_RECEIVED,
  NOTIFICATION_READ,
  NOTIFICATIONS_ALL_READ,
  NOTIFICATION_DELETED,
  NOTIFICATIONS_ALL_DELETED,
} from "../actions/notificationsActions";

const initialState = { list: [] };

export const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case NOTIFICATIONS_SUCCESS:
      return { list: action.payload };

    case NOTIFICATION_RECEIVED:
      return { list: [action.payload, ...state.list] };

    case NOTIFICATION_READ:
      return {
        list: state.list.map(n =>
          n.id === action.payload ? { ...n, is_read: true } : n
        ),
      };

    case NOTIFICATIONS_ALL_READ:
      return { list: state.list.map(n => ({ ...n, is_read: true })) };

    case NOTIFICATION_DELETED:
      return { list: state.list.filter(n => n.id !== action.payload) };

    case NOTIFICATIONS_ALL_DELETED:
      return { list: [] };

    default:
      return state;
  }
};
