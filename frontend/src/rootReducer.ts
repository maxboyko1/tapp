import { notificationReducer } from "./api/reducers/notifications";
import { combineReducers } from "./api/reducers/utils";
import { globalReducer } from "./api/reducers";
import { offerTableReducer } from "./views/admin/offertable/reducers";
import { guaranteeTableReducer } from "./views/admin/guarantees/reducers";
import {
    statusReducer,
    sessionsReducer,
    positionsReducer,
    applicantsReducer,
    applicationsReducer,
    assignmentsReducer,
    instructorsReducer,
    contractTemplatesReducer,
    letterTemplatesReducer,
    ddahsReducer,
    postingsReducer,
    postingPositionsReducer,
    matchesReducer,
    applicantMatchingDataReducer,
} from "./api/reducers";
import { usersReducer } from "./api/reducers/users";
import { ddahsTableReducer } from "./views/admin/ddah-table/reducers";
import { positionsTableReducer } from "./views/admin/positions/reducers";
import { instructorUIReducer } from "./views/instructor/store/reducers";
import { instructorPreferencesReducer } from "./api/reducers";
import { matchingDataReducer } from "./views/admin/matching/reducers";

// When `combineReducers` is used,
// every action gets dispatched to every reducer.
// Since reducers don't change the state on unrecognized
// actions, this is okay. Further, each reducer believes
// it has its own top-level state, but in reality it is
// just passed a part of the whole state. E.g., if `combineReducers`
// is passed
//   {
//      mypath: myReducer
//   }
// When `myReducer(localState)` is called, `localState == globalState.mypath`.
const reducer = combineReducers({
    model: combineReducers({
        status: statusReducer,
        sessions: sessionsReducer,
        positions: positionsReducer,
        applicants: applicantsReducer,
        applications: applicationsReducer,
        assignments: assignmentsReducer,
        instructors: instructorsReducer,
        contractTemplates: contractTemplatesReducer,
        letterTemplates: letterTemplatesReducer,
        postings: postingsReducer,
        postingPositions: postingPositionsReducer,
        users: usersReducer,
        ddahs: ddahsReducer,
        instructorPreferences: instructorPreferencesReducer,
        matches: matchesReducer,
        applicantMatchingData: applicantMatchingDataReducer,
    }),
    ui: combineReducers({
        notifications: notificationReducer,
        offerTable: offerTableReducer,
        ddahsTable: ddahsTableReducer,
        positionsTable: positionsTableReducer,
        globals: globalReducer,
        instructor: instructorUIReducer,
        matchingData: matchingDataReducer,
        guaranteeTable: guaranteeTableReducer,
    }),
});

export type RootState = ReturnType<typeof reducer>;
export default reducer;
