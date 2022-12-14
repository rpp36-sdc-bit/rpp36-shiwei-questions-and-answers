const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  port: process.env.PORT,
})

const getQuestions = (productId) => {
  return new Promise ((resolve, reject) => {
    let queryQuestions = `
    SELECT
    q.question_id,
    q.question_body,
    q.question_date,
    q.asker_name,
    q.question_helpfulness,
    q.question_reported AS reported,
      ( SELECT COALESCE(json_agg (eachAnswer), '{}')
        FROM ( SELECT
          a.question_id AS id,
          a.answer_body AS body,
          a.answer_date AS date,
          a.answerer_name,
          a.answer_helpfulness AS helpfulness,
          a.answer_reported AS reported,
          ( SELECT COALESCE(json_agg(eachPhoto), '[]')
            FROM (
              SELECT
              p.photo_id AS id,
              p.photo_url AS url
              FROM photos p
              WHERE p.answer_id = a.answer_id
            ) eachPhoto
          ) AS photos
          FROM answers a
          WHERE a.question_id = q.question_id
        ) eachAnswer
      ) AS answers
    FROM questions q
    WHERE product_id = ${productId};
    `
    pool.query(queryQuestions, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

const postQuestion = (data) => {
  let productId = data.product_id;
  let body = data.body;
  let name = data.name;
  let email = data.email;

  return new Promise ((resolve, reject) => {
    let queryPostQuestion = `
    INSERT INTO questions
    (product_id, question_body, question_date, asker_name, asker_email)
    VALUES (${productId}, '${body}', NOW(), '${name}', '${email}');
    `
    pool.query(queryPostQuestion, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

const postAnswer = (data, questionId) => {
  let body = data.body;
  let name = data.name;
  let email = data.email;

  return new Promise ((resolve, reject) => {
    let queryPostAnswer = `
    INSERT INTO answers
    (question_id, answer_body, answer_date, answerer_name, answerer_email)
    VALUES (${questionId}, '${body}', NOW(), '${name}', '${email}')
    RETURNING answer_id;
    `
    pool.query(queryPostAnswer, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

const postPhoto = (answerId, url) => {
  return new Promise ((resolve, reject) => {
    let queryPostPhoto = `
    INSERT INTO photos
    (answer_id, photo_url)
    VALUES (${answerId}, '${url}');
    `

    pool.query(queryPostPhoto, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

const questionHelpful = (questionId) => {
  return new Promise ((resolve, reject) => {
    let queryQHelpful = `UPDATE questions SET question_helpfulness = question_helpfulness + 1 WHERE question_id = ${questionId};`

    pool.query(queryQHelpful, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

const answerHelpful = (answerId) => {
  return new Promise ((resolve, reject) => {
    let queryAHelpful = `UPDATE answers SET answer_helpfulness = answer_helpfulness + 1 WHERE answer_id = ${answerId};`

    pool.query(queryAHelpful, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}

const reportQuestion = (questionId) => {
  return new Promise ((resolve, reject) => {
    let queryQReport = `UPDATE questions SET question_reported = 'true' WHERE question_id = ${questionId};`

    pool.query(queryQReport, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}


const reportAnswer = (answerId) => {
  return new Promise ((resolve, reject) => {
    let queryAReport = `UPDATE answers SET answer_reported = 'true' WHERE answer_id = ${answerId};`

    pool.query(queryAReport, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
}


module.exports = {
  getQuestions,
  postQuestion,
  postAnswer,
  postPhoto,
  questionHelpful,
  answerHelpful,
  reportQuestion,
  reportAnswer,
  pool,
};


