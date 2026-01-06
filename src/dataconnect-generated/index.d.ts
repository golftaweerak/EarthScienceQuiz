import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Answer_Key {
  id: UUIDString;
  __typename?: 'Answer_Key';
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface GetQuestionsForQuizData {
  questions: ({
    id: UUIDString;
    text: string;
    answerOptions?: string[] | null;
    type: string;
  } & Question_Key)[];
}

export interface GetQuestionsForQuizVariables {
  quizId: UUIDString;
}

export interface ListQuizzesData {
  quizzes: ({
    id: UUIDString;
    title: string;
    description?: string | null;
  } & Quiz_Key)[];
}

export interface Question_Key {
  id: UUIDString;
  __typename?: 'Question_Key';
}

export interface QuizAttempt_Key {
  id: UUIDString;
  __typename?: 'QuizAttempt_Key';
}

export interface Quiz_Key {
  id: UUIDString;
  __typename?: 'Quiz_Key';
}

export interface Subject_Key {
  id: UUIDString;
  __typename?: 'Subject_Key';
}

export interface TakeQuizData {
  quizAttempt_insert: QuizAttempt_Key;
}

export interface TakeQuizVariables {
  quizId: UUIDString;
  userId: UUIDString;
}

export interface Topic_Key {
  id: UUIDString;
  __typename?: 'Topic_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListQuizzesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListQuizzesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListQuizzesData, undefined>;
  operationName: string;
}
export const listQuizzesRef: ListQuizzesRef;

export function listQuizzes(): QueryPromise<ListQuizzesData, undefined>;
export function listQuizzes(dc: DataConnect): QueryPromise<ListQuizzesData, undefined>;

interface TakeQuizRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TakeQuizVariables): MutationRef<TakeQuizData, TakeQuizVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TakeQuizVariables): MutationRef<TakeQuizData, TakeQuizVariables>;
  operationName: string;
}
export const takeQuizRef: TakeQuizRef;

export function takeQuiz(vars: TakeQuizVariables): MutationPromise<TakeQuizData, TakeQuizVariables>;
export function takeQuiz(dc: DataConnect, vars: TakeQuizVariables): MutationPromise<TakeQuizData, TakeQuizVariables>;

interface GetQuestionsForQuizRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetQuestionsForQuizVariables): QueryRef<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetQuestionsForQuizVariables): QueryRef<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;
  operationName: string;
}
export const getQuestionsForQuizRef: GetQuestionsForQuizRef;

export function getQuestionsForQuiz(vars: GetQuestionsForQuizVariables): QueryPromise<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;
export function getQuestionsForQuiz(dc: DataConnect, vars: GetQuestionsForQuizVariables): QueryPromise<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;

