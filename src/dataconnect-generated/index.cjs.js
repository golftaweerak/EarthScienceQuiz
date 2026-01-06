const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'earthsciencequiz',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const listQuizzesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListQuizzes');
}
listQuizzesRef.operationName = 'ListQuizzes';
exports.listQuizzesRef = listQuizzesRef;

exports.listQuizzes = function listQuizzes(dc) {
  return executeQuery(listQuizzesRef(dc));
};

const takeQuizRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TakeQuiz', inputVars);
}
takeQuizRef.operationName = 'TakeQuiz';
exports.takeQuizRef = takeQuizRef;

exports.takeQuiz = function takeQuiz(dcOrVars, vars) {
  return executeMutation(takeQuizRef(dcOrVars, vars));
};

const getQuestionsForQuizRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetQuestionsForQuiz', inputVars);
}
getQuestionsForQuizRef.operationName = 'GetQuestionsForQuiz';
exports.getQuestionsForQuizRef = getQuestionsForQuizRef;

exports.getQuestionsForQuiz = function getQuestionsForQuiz(dcOrVars, vars) {
  return executeQuery(getQuestionsForQuizRef(dcOrVars, vars));
};
