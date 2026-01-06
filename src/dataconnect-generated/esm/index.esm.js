import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'earthsciencequiz',
  location: 'us-east4'
};

export const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';

export function createUser(dc) {
  return executeMutation(createUserRef(dc));
}

export const listQuizzesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListQuizzes');
}
listQuizzesRef.operationName = 'ListQuizzes';

export function listQuizzes(dc) {
  return executeQuery(listQuizzesRef(dc));
}

export const takeQuizRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TakeQuiz', inputVars);
}
takeQuizRef.operationName = 'TakeQuiz';

export function takeQuiz(dcOrVars, vars) {
  return executeMutation(takeQuizRef(dcOrVars, vars));
}

export const getQuestionsForQuizRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetQuestionsForQuiz', inputVars);
}
getQuestionsForQuizRef.operationName = 'GetQuestionsForQuiz';

export function getQuestionsForQuiz(dcOrVars, vars) {
  return executeQuery(getQuestionsForQuizRef(dcOrVars, vars));
}

