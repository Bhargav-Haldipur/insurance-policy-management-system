import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Box } from '@mui/material'
import {
  getPolicyEvents,
  getApiErrorMessage,
} from '../services/policy_Service'
import { formatTimestamp } from '../utils/dateFormat'

function PolicyEventsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getPolicyEvents(id)

        console.log('EVENT RESPONSE:', data)
        console.log('IS ARRAY:', Array.isArray(data))

        setEvents(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('EVENT ERROR:', err)

        setError(
          getApiErrorMessage(
            err,
            'Unable to load policy event history.'
          )
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [id])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4" fontWeight={600}>
          Policy Event History
        </Typography>

        <Button
          variant="outlined"
          onClick={() => navigate('/policies')}
        >
          Back to Policies
        </Button>
      </Box>

        <Typography>Policy ID: {id}</Typography>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event ID</TableCell>
                <TableCell>Policy ID</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Payload</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No events found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.id}</TableCell>
                    <TableCell>{event.policyId}</TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>
                      {formatTimestamp(event.timestamp)}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 500,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {event.payload}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Container>
  )
}

export default PolicyEventsPage