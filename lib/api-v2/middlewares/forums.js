const privileges = require('lib/privileges/forum')
const config = require('lib/config')
const api = require('../db-api')

exports.privileges = Object.keys(privileges).reduce((middles, privilege) => {
  function middleware (req, res, next) {
    if (privileges[privilege](req.forum, req.user)) return next()

    const err = new Error('User doesn\'t have enough privileges on forum.')
    err.status = 403
    err.code = 'LACK_PRIVILEGES'

    next(err)
  }

  middles[privilege] = middleware
  return middles
}, {})

function findWithId (id, req, res, next) {
  api.forums.find({ _id: id })
    .findOne()
    .exec()
    .then((forum) => {
      if (!forum) {
        const err = new Error(`Forum ${id} not found.`)
        err.status = 404
        err.code = 'FORUM_NOT_FOUND'
        return next(err)
      }

      req.forum = forum

      next()
    })
    .catch(next)
}

exports.findById = function findById (req, res, next) {
  return findWithId(req.params.id, req, res, next)
}

exports.findFromBody = function findFromBody (req, res, next) {
  return findWithId(req.body.forum, req, res, next)
}

exports.findFromQuery = function findFromBody (req, res, next) {
  return findWithId(req.query.forum, req, res, next)
}

exports.findFromTopic = function findFromTopic (req, res, next) {
  return findWithId(req.topic.forum, req, res, next)
}

exports.findByName = function findByName (req, res, next) {
  const name = config.multiForum ? req.query.forum : config.defaultForum

  api.forums.find({ name: name })
    .findOne()
    .exec()
    .then((forum) => {
      if (!forum) {
        const err = new Error(`Forum ${name} not found.`)
        err.status = 404
        err.code = 'FORUM_NOT_FOUND'
        return next(err)
      }

      req.forum = forum

      next()
    })
    .catch(next)
}

exports.findTags = function findTags (req, res, next) {
  const id = req.forum.id

  api.topics.find({ forum: id })
    .distinct('tags')
    .exec()
    .then((tags) => {
      req.tags = tags
      next()
    })
    .catch(next)
}
