import { useTranslation, Trans } from 'react-i18next';
import apiClient from '../../config/API/axiosConfig.mjs';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import classes from './AuthenticationTitle.module.css';
import { useNavigate } from 'react-router';
import Seo from '../Seo.jsx';

const CustomerRegistrationForm = () => {
  const { t } = useTranslation();
  const [registerResponse, setRegisterResponse] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const data = {
      username: e.target.username.value,
      password: e.target.password.value,
    };

    try {
      await apiClient.post('/api/v1/auth/register', data);

      setRegisterResponse({ message: t('auth.register.success') });

      setRegisterError(null);

      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err) {
      setRegisterResponse(null);

      if (err.status === 422) {
        return setRegisterError({ message: t('auth.register.errors.invalid') });
      }

      return setRegisterError({ message: t('auth.register.errors.internal') });
    }
  };

  return (
    <>
      <Container size={420} my={40}>
        <Seo title={t('seo.pages.register')} />
        <Title ta="center" className={classes.title}>
          {t('auth.register.title')}
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          {t('auth.register.hasAccount')}{' '}
          <Anchor component={Link} to="/auth/login" size="sm">
            {t('auth.register.loginLink')}
          </Anchor>
        </Text>

        {registerResponse && (
          <Paper shadow="xs" p={10} mt={20} radius="sm" style={{ backgroundColor: '#ccffcc' }}>
            {registerResponse.message}
          </Paper>
        )}

        {registerError && (
          <Paper shadow="xs" p={10} mt={20} radius="sm" style={{ backgroundColor: '#ffcccc' }}>
            {registerError.message}
          </Paper>
        )}
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={handleRegister}>
            <TextInput
              name="username"
              label={t('auth.fields.email')}
              placeholder={t('auth.fields.emailPlaceholderAlt')}
              required
            />
            <PasswordInput
              name="password"
              label={t('auth.fields.password')}
              placeholder={t('auth.fields.passwordPlaceholder')}
              required
              mt="md"
            />

            <Button type="submit" fullWidth mt="xl">
              {t('auth.register.submit')}
            </Button>
          </form>
          <Text size="sm" c="dimmed" className="terms-and-conditions" style={{ textAlign: 'center', marginTop: '10px' }}>
            <Trans
              i18nKey="auth.register.terms"
              t={t}
              components={[<Link key="terms" to="/terminos-condiciones" />, <Link key="terms-label" to="/terminos-condiciones" />]}
            />
          </Text>
        </Paper>
      </Container>
    </>
  );
};

export default CustomerRegistrationForm;
