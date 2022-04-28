const yup = require('yup');

const loginSchema = yup.object({
  password: yup.string().required(),
});
const registerSchema = yup.object({
  name: yup.string().required(),
  surname: yup.string().required(),
  email: yup.string().email().required(),
  phone: yup.string().max(10).min(10).required(),
  password: yup.string().required().max(15).min(8),
  passwordConfirmation: yup.string().oneOf([yup.ref('password'), null]),
});
const forgotPasswordSchema = yup.object({
  email: yup.string().email().required(),
});
const changePasswordSchema = yup.object({
  password: yup.string().required().max(15).min(8),
  passwordConfirmation: yup.string().oneOf([yup.ref('password'), null]),
  code: yup.string().required(),
});

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  changePasswordSchema,
};
