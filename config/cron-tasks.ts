// config/cron-tasks.js
'use strict';

/**
 * Cron yapılandırması
 * Daha fazla bilgi için: https://docs.strapi.io/dev-docs/configurations/cron
 */
module.exports = {
  /**
   * Exam tarihi kontrolü için cron
   * Her gün gece yarısı çalışır
   */
  examDateChecker: {
    task: ({ strapi }) => strapi.service('api::exam.exam-date-checker').checkExamDates(),
    options: {
      rule: '0 0 * * *', // Her gün gece yarısı (00:00)
      // rule: '*/30 * * * *', // Her 30 dakikada bir (test için)
    },
  },
  
  /**
   * Exam tarihi kontrolü için ek cron (saatlik kontrol)
   * Daha sık kontrol istenirse
   */
  hourlyExamCheck: {
    task: ({ strapi }) => strapi.service('api::exam.exam-date-checker').checkExamDates(),
    options: {
      rule: '0 * * * *', // Her saatin başında
    },
  },
};