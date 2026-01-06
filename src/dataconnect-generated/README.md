# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListQuizzes*](#listquizzes)
  - [*GetQuestionsForQuiz*](#getquestionsforquiz)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*TakeQuiz*](#takequiz)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListQuizzes
You can execute the `ListQuizzes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listQuizzes(): QueryPromise<ListQuizzesData, undefined>;

interface ListQuizzesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListQuizzesData, undefined>;
}
export const listQuizzesRef: ListQuizzesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listQuizzes(dc: DataConnect): QueryPromise<ListQuizzesData, undefined>;

interface ListQuizzesRef {
  ...
  (dc: DataConnect): QueryRef<ListQuizzesData, undefined>;
}
export const listQuizzesRef: ListQuizzesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listQuizzesRef:
```typescript
const name = listQuizzesRef.operationName;
console.log(name);
```

### Variables
The `ListQuizzes` query has no variables.
### Return Type
Recall that executing the `ListQuizzes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListQuizzesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListQuizzesData {
  quizzes: ({
    id: UUIDString;
    title: string;
    description?: string | null;
  } & Quiz_Key)[];
}
```
### Using `ListQuizzes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listQuizzes } from '@dataconnect/generated';


// Call the `listQuizzes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listQuizzes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listQuizzes(dataConnect);

console.log(data.quizzes);

// Or, you can use the `Promise` API.
listQuizzes().then((response) => {
  const data = response.data;
  console.log(data.quizzes);
});
```

### Using `ListQuizzes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listQuizzesRef } from '@dataconnect/generated';


// Call the `listQuizzesRef()` function to get a reference to the query.
const ref = listQuizzesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listQuizzesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.quizzes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.quizzes);
});
```

## GetQuestionsForQuiz
You can execute the `GetQuestionsForQuiz` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getQuestionsForQuiz(vars: GetQuestionsForQuizVariables): QueryPromise<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;

interface GetQuestionsForQuizRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetQuestionsForQuizVariables): QueryRef<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;
}
export const getQuestionsForQuizRef: GetQuestionsForQuizRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getQuestionsForQuiz(dc: DataConnect, vars: GetQuestionsForQuizVariables): QueryPromise<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;

interface GetQuestionsForQuizRef {
  ...
  (dc: DataConnect, vars: GetQuestionsForQuizVariables): QueryRef<GetQuestionsForQuizData, GetQuestionsForQuizVariables>;
}
export const getQuestionsForQuizRef: GetQuestionsForQuizRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getQuestionsForQuizRef:
```typescript
const name = getQuestionsForQuizRef.operationName;
console.log(name);
```

### Variables
The `GetQuestionsForQuiz` query requires an argument of type `GetQuestionsForQuizVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetQuestionsForQuizVariables {
  quizId: UUIDString;
}
```
### Return Type
Recall that executing the `GetQuestionsForQuiz` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetQuestionsForQuizData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetQuestionsForQuizData {
  questions: ({
    id: UUIDString;
    text: string;
    answerOptions?: string[] | null;
    type: string;
  } & Question_Key)[];
}
```
### Using `GetQuestionsForQuiz`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getQuestionsForQuiz, GetQuestionsForQuizVariables } from '@dataconnect/generated';

// The `GetQuestionsForQuiz` query requires an argument of type `GetQuestionsForQuizVariables`:
const getQuestionsForQuizVars: GetQuestionsForQuizVariables = {
  quizId: ..., 
};

// Call the `getQuestionsForQuiz()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getQuestionsForQuiz(getQuestionsForQuizVars);
// Variables can be defined inline as well.
const { data } = await getQuestionsForQuiz({ quizId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getQuestionsForQuiz(dataConnect, getQuestionsForQuizVars);

console.log(data.questions);

// Or, you can use the `Promise` API.
getQuestionsForQuiz(getQuestionsForQuizVars).then((response) => {
  const data = response.data;
  console.log(data.questions);
});
```

### Using `GetQuestionsForQuiz`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getQuestionsForQuizRef, GetQuestionsForQuizVariables } from '@dataconnect/generated';

// The `GetQuestionsForQuiz` query requires an argument of type `GetQuestionsForQuizVariables`:
const getQuestionsForQuizVars: GetQuestionsForQuizVariables = {
  quizId: ..., 
};

// Call the `getQuestionsForQuizRef()` function to get a reference to the query.
const ref = getQuestionsForQuizRef(getQuestionsForQuizVars);
// Variables can be defined inline as well.
const ref = getQuestionsForQuizRef({ quizId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getQuestionsForQuizRef(dataConnect, getQuestionsForQuizVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.questions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.questions);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## TakeQuiz
You can execute the `TakeQuiz` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
takeQuiz(vars: TakeQuizVariables): MutationPromise<TakeQuizData, TakeQuizVariables>;

interface TakeQuizRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TakeQuizVariables): MutationRef<TakeQuizData, TakeQuizVariables>;
}
export const takeQuizRef: TakeQuizRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
takeQuiz(dc: DataConnect, vars: TakeQuizVariables): MutationPromise<TakeQuizData, TakeQuizVariables>;

interface TakeQuizRef {
  ...
  (dc: DataConnect, vars: TakeQuizVariables): MutationRef<TakeQuizData, TakeQuizVariables>;
}
export const takeQuizRef: TakeQuizRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the takeQuizRef:
```typescript
const name = takeQuizRef.operationName;
console.log(name);
```

### Variables
The `TakeQuiz` mutation requires an argument of type `TakeQuizVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TakeQuizVariables {
  quizId: UUIDString;
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `TakeQuiz` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TakeQuizData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TakeQuizData {
  quizAttempt_insert: QuizAttempt_Key;
}
```
### Using `TakeQuiz`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, takeQuiz, TakeQuizVariables } from '@dataconnect/generated';

// The `TakeQuiz` mutation requires an argument of type `TakeQuizVariables`:
const takeQuizVars: TakeQuizVariables = {
  quizId: ..., 
  userId: ..., 
};

// Call the `takeQuiz()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await takeQuiz(takeQuizVars);
// Variables can be defined inline as well.
const { data } = await takeQuiz({ quizId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await takeQuiz(dataConnect, takeQuizVars);

console.log(data.quizAttempt_insert);

// Or, you can use the `Promise` API.
takeQuiz(takeQuizVars).then((response) => {
  const data = response.data;
  console.log(data.quizAttempt_insert);
});
```

### Using `TakeQuiz`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, takeQuizRef, TakeQuizVariables } from '@dataconnect/generated';

// The `TakeQuiz` mutation requires an argument of type `TakeQuizVariables`:
const takeQuizVars: TakeQuizVariables = {
  quizId: ..., 
  userId: ..., 
};

// Call the `takeQuizRef()` function to get a reference to the mutation.
const ref = takeQuizRef(takeQuizVars);
// Variables can be defined inline as well.
const ref = takeQuizRef({ quizId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = takeQuizRef(dataConnect, takeQuizVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.quizAttempt_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.quizAttempt_insert);
});
```

