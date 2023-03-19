const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()


const Person = require('./models/person')

const { request } = require('express')

const errorHandler = (error, request, response, next) => {
    console.log(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(express.json())
app.use(cors())
app.use(express.static('build'))
app.use(morgan((tokens, req, res) => {
    let data = JSON.stringify(req.body)
    if (data === '{}') data = ''
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        data
    ].join(' ')
}))
app.morgan

app.get('/persons', (request, response) => {
    Person.find({}).then(people => {
        response.json(people)
    })
})

app.get('/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.get('/info', (request, response) => {
    let count = 0
    Person.count({}).then(result => {
        response.send(`
            <p>Phonebook has info for ${result} people</p>               
            <p>${new Date()}</p>
            `)
    })
})

app.delete('/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/persons', (request, response, next) => {
    const body = request.body

    if (body.name === undefined || body.number === undefined) {
        return response.status(400).json({
            error: 'name or number is missing'
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
})

app.put('/persons/:id', (request, response, next) => {
    const { name, number } = request.body

    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(
        request.params.id,
        { name, number },
        { runValidators: true, context: 'query' }
    )
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT), () => {
    console.log(`Server running on port ${PORT}`)
}