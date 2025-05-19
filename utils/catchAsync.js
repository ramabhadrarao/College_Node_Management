// utils/catchAsync.js
/**
 * Wrapper function to catch async errors
 * @param {Function} fn - Async function to execute
 * @returns {Function} Express middleware function
 */
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};