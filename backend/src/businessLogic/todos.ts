import { TodosAccess } from '../dataLayer/todosAcess'
//import { AttachmentUtils } from '../helpers/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import * as createError from 'http-errors'
import { parseUserId } from '../auth/utils'

// TODO: Implement businessLogic

const todoAccess = new TodosAccess()
const logger = createLogger('Todos')

export async function getTodosForUser(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)

  return todoAccess.getTodos(userId)
}
export async function createTodo(
  jwtToken: string,
  CreateTodoRequest: CreateTodoRequest
) {
  const userId = parseUserId(jwtToken)
  const todoId = uuid.v4()

  logger.info('userId', userId)
  logger.info('todoId', todoId)

  const item = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    ...CreateTodoRequest,
    attachmentUrl: ''
  }

  logger.info('Item to be created at business logic', item)
  const toReturn = todoAccess.createTodo(item)

  return toReturn
}

export async function deleteTodo(jwtToken: string, todoId: string) {
  const userId = parseUserId(jwtToken)
  const toReturn = todoAccess.deleteItem(userId, todoId)

  return toReturn
}

export async function updateTodo(
  jwtToken: string,
  todoId: string,
  UpdateTodoRequest: UpdateTodoRequest
) {
  const userId = parseUserId(jwtToken)
  const result = todoAccess.updateTodo(UpdateTodoRequest, todoId, userId)

  return result
}

export async function createAttachmentPresignedUrl(
  jwtToken: string,
  todoId: string
) {
  const userId = parseUserId(jwtToken)
  const result = todoAccess.createAttachmentPresignedUrl(userId, todoId)

  return result
}
