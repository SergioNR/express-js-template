import { Card, Text, Group, Divider, Badge, Box } from '@mantine/core';
import { IconUser, IconMail, IconShield, IconCalendar, IconLogin } from '@tabler/icons-react';

const CustomerCard = ({user}) => {

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            sx={(theme) => ({
                transition: 'transform 0.2s ease',
                '&:hover': {
                    transform: 'scale(1.02)',
                },
            })}
        >
            <Group position="apart" mb="md">
                <Group>
                    <IconUser size={24} />
                    <Text weight={600} size="xl">User Profile</Text>
                </Group>
                <Badge color={user.role === 'admin' ? 'red' : 'blue'} variant="light">
                    {user.role}
                </Badge>
            </Group>
            
            <Divider my="sm" />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'md' }}>
                <Group>
                    <IconMail color="#666" />
                    <Box>
                        <Text size="xs" color="dimmed">Email</Text>
                        <Text weight={500}>{user.email}</Text>
                    </Box>
                </Group>
            </Box>
        </Card>
    )
}

export default CustomerCard;