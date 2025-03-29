// src/api/question/routes/custom-routes.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/questions/:id',
      handler: 'question.findById',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};