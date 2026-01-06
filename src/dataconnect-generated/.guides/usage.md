# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, listQuizzes, takeQuiz, getQuestionsForQuiz } from '@dataconnect/generated';


// Operation CreateUser: 
const { data } = await CreateUser(dataConnect);

// Operation ListQuizzes: 
const { data } = await ListQuizzes(dataConnect);

// Operation TakeQuiz:  For variables, look at type TakeQuizVars in ../index.d.ts
const { data } = await TakeQuiz(dataConnect, takeQuizVars);

// Operation GetQuestionsForQuiz:  For variables, look at type GetQuestionsForQuizVars in ../index.d.ts
const { data } = await GetQuestionsForQuiz(dataConnect, getQuestionsForQuizVars);


```