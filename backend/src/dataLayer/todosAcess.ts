import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly s3Bucket = process.env.ATTACHMENT_S3_BUCKET,
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getTodos(userId): Promise<TodoItem[]> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    logger.info('Result', result)

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async deleteItem(userId: string, todoId: string) {
    let result = {
      statusCode: 200,
      body: ''
    }

    let todoToBeDeleted = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':todoId': todoId
        }
      })
      .promise()

    if (todoToBeDeleted.Items.length === 0) {
      result.statusCode = 404
      result.body = 'Item not found'
      return result
    }

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      })
      .promise()

    await this.s3
      .deleteObject({
        Bucket: this.s3Bucket,
        Key: todoId
      })
      .promise()

    return result
  }

  async updateTodo(
    todoUpdate: TodoUpdate,
    todoId: string,
    userId: string
  ): Promise<TodoUpdate> {
    console.log(`Updating Todo with id ${todoId}`)

    const params = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'set #a = :a, #b = :b, #c = :c',
      ExpressionAttributeNames: {
        '#a': 'name',
        '#b': 'dueDate',
        '#c': 'done'
      },
      ExpressionAttributeValues: {
        ':a': todoUpdate['name'],
        ':b': todoUpdate['dueDate'],
        ':c': todoUpdate['done']
      },
      ReturnValues: 'ALL_NEW'
    }

    const result = await this.docClient.update(params).promise()
    console.log(`Result is ${result}`)
    const attributes = result.Attributes

    return attributes as TodoUpdate
  }

  async createAttachmentPresignedUrl(userId, todoId) {
    let result = {
      statusCode: 201,
      body: ''
    }

    let checkIfExist = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':todoId': todoId
        }
      })
      .promise()

    if (checkIfExist.Items.length === 0) {
      result = {
        statusCode: 404,
        body: 'Item not found'
      }
      return result
    }

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set #attachmentUrl =:attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': `https://${this.s3Bucket}.s3.amazonaws.com/${todoId}`
        },
        ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    result.body = this.s3.getSignedUrl('putObject', {
      Bucket: this.s3Bucket,
      Key: todoId,
      Expires: parseInt(this.urlExpiration)
    })

    return result
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new AWS.DynamoDB.DocumentClient()
}
