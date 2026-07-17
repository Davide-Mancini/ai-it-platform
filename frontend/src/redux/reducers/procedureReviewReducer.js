import {
  REVIEW_FINDINGS_LOADING,
  REVIEW_FINDINGS_SUCCESS,
  REVIEW_FINDING_UPDATE,
  REVIEW_RUN_STARTED,
  REVIEW_RUN_UPDATE,
  REVIEW_RUNS_SUCCESS,
} from "../actions/procedureReviewActions";

const initialState = {
  loading: false,
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  runs: [],
  lastRun: null,
};

export const procedureReviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case REVIEW_FINDINGS_LOADING:
      return { ...state, loading: true };

    case REVIEW_FINDINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload.items,
        total: action.payload.total,
        page: action.payload.page,
        pageSize: action.payload.page_size,
      };

    case REVIEW_FINDING_UPDATE:
      return {
        ...state,
        items: state.items.map(f =>
          f.id === action.payload.id ? { ...f, ...action.payload } : f
        ),
      };

    case REVIEW_RUN_STARTED:
    case REVIEW_RUN_UPDATE:
      return { ...state, lastRun: action.payload };

    case REVIEW_RUNS_SUCCESS:
      return { ...state, runs: action.payload };

    default:
      return state;
  }
};
