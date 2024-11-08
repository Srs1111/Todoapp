const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB error: ${error.message};`)
    process.exit(1)
  }
}

intializeDbAndServer()

const priorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const categoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasDueDateProperty = requestQuery => {
  return requestQuery.dueDate !== undefined
}

const isValidTodoPriority = item => {
  if (item === 'HIGH' || item === 'MEDIUM' || item === 'LOW') {
    return true
  } else {
    return false
  }
}

const isValidTodoCategory = item => {
  if (item === 'WORK' || item === 'HOME' || item === 'LEARNING') {
    return true
  } else {
    return false
  }
}

const isValidTodoStatus = item => {
  if (item === 'TO DO' || item === 'IN PROGRESS' || item === 'DONE') {
    return true
  } else {
    return false
  }
}

const isValidTodoDueDate = item => {
  return isValid(new Date(item))
}

const convertDueDate = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    due_date: dbObject.due_date,
  }
}

//api 1

app.get(`/todos/`, async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case priorityAndStatusProperty(request.query):
      getTodosQuery = `
      
      SELECT 
       * 
      FROM 
       todo 
      WHERE 
       todo LIKE '%${search_q}%'
       AND  status = '${status}'
       AND priority = '${priority}';`

      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery)
        response.send(data.map((object) => convertDueDate(object)))
      } else if (isValidTodoPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case categoryAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT 
         *
        FROM 
         todo 
        WHERE 
         todo LIKE '${search_q}'
         AND status = '${status}'
         AND category = '${category}';`

      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE 
         todo LIKE '%${search_q}%'
         AND priority = '${priority}'
         AND category = '${category}';`

      if (isValidTodoCategory(category) && isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else if (isValidTodoCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todod Category')
      }
      break
    case hasCategoryProperty(request.query):
      getTodosQuery = `
         SELECT 
          *
         FROM 
          todo 
        WHERE 
         todo LIKE '%${search_q}%'
         AND category = '${category};`
      if (isValidTodoCategory(category)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(object => hasCategoryProperty(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT 
         *
        FROM 
         todo 
        WHERE 
         todo LIKE '%${search_q}%'
         AND priority = '${priority};`
      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
         SELECT 
          * 
        FROM 
         todo 
        WHERE 
         todo LIKE '%${search_q}%'
         AND status = '${status}';`
      if (isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery)
        response.send(data.map(object => convertDueDate(object)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    default:
      getTodosQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE 
         todo LIKE '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(data.map(object => convertDueDate(object)))
  }
})

//api 2

app.get(`/todos/:todoId/`, async (request, response) => {
  const {todoId} = request.params
  const getScecondTodoQuery = `
    SELECT 
      * 
    FROM
      todo 
    WHERE 
     id = ${todoId};`

  const todo = await db.get(getScecondTodoQuery)
  response.send(convertDueDate(todo))
})

//api 3

app.get(`/agenda/`, async (request, response) => {
  const {date} = request.query

  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidTodoDueDate(date)) {
      const formatDate = format(new Date(date), 'yyyy-MM-dd')
      const thirdGetTodoQuery = `
                  SELECT 
                   * 
                  FROM 
                   todo 
                  WHERE 
                   due_date = '${formatDate}';`

      const todo = await db.all(thirdGetTodoQuery)
      response.send(todo.map((object) => convertDueDate(object)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

// api 4

app.post(`/todos/`, async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoDetails

  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidTodoStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isValidTodoCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isValidTodoDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const fromattDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const addTodoQuery = `
              INSERT INTO 
                 todo (id, todo, priority, status, category, due_date)
              VALUES 
                  (
                    ${id},
                    '${todo}',
                    '${priority}',
                    '${status}',
                    '${category}',
                    '${fromattDate}');`
      const dbResponse = await db.run(addTodoQuery)
      response.send('Todo Successfully Added')
      break
  }
})

//api 5

app.put(`/todos/:todoId/`, async (request, response) => {
  const {todoId} = request.params
  const putTodoDeatils = request.body
  const {todo, priority, status, dueDate, category} = putTodoDeatils
  switch (true) {
    case hasStatusProperty(request.body):
      const updateStatusQuery = `
                  UPDATE 
                    todo 
                  SET 
                    status = '${status}'
                  WHERE 
                    id = ${todoId};`
      if (isValidTodoStatus(status)) {
        await db.run(updateStatusQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategoryProperty(request.body):
      const updateCategoryQuery = `
                   UPDATE 
                     todo 
                   SET 
                     category = '${category}'
                   WHERE 
                     id = ${todoId};`

      if (isValidTodoCategory(category)) {
        await db.run(updateCategoryQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.body):
      const updatePriorityPropertyQuery = `
                 UPDATE 
                    todo 
                 SET  
                   priority = '${priority}'
                 WHERE 
                   id = ${todoId};`
      if (isValidTodoPriority(priority)) {
        await db.run(updatePriorityPropertyQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasDueDateProperty(request.body):
      const updateDueDateQuery = `
                 UPDATE 
                   todo
                 SET 
                   due_date = '${dueDate}'
                 WHERE
                   id = ${todoId};`
      if (isValidTodoDueDate(dueDate)) {
        await db.run(updateDueDateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      const updatTodoDefaultQuery = `
               UPDATE 
                  todo 
               SET 
                 todo = '${todo}'
               WHERE 
                 id = ${todoId};`
      await db.run(updatTodoDefaultQuery)
      response.send('Todo Updated')
      break
  }
})

//api delete

app.delete(`/todos/:todoId/`, async (request, response) => {
  const {todoId} = request.params
  const updateDeleteQuery = `
           DELETE FROM 
               todo
           WHERE 
              id = ${todoId};`
  await db.run(updateDeleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
