import { Container, Title, Text, Paper, Stack } from '@mantine/core';
import NoActiveSubscriptionBanner from "../../components/partials/NoActiveSubscriptionBanner.jsx";

const UserDashboard = () => {
    return (
        <Container size="xl" py="xl">
            <NoActiveSubscriptionBanner />

            <Paper shadow="xs" p="xl" radius="md" withBorder>
                <Stack gap="xs">
                    <Title order={2}>Dashboard</Title>
                    <Text c="dimmed">
                        Placeholder del área de usuario. Añade aquí los contenidos de tu aplicación.
                    </Text>
                </Stack>
            </Paper>
        </Container>
    );
};

export default UserDashboard;
