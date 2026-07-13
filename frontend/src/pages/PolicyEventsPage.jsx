import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
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
import {
  getPolicyEvents,
  getApiErrorMessage,
} from '../services/policy_Service'
import { formatTimestamp } from '../utils/dateFormat'

function formatPayload(payload) {
  if (!payload) return '—'
  const match = payload.match(/^\w+\((.+)\)$/s)
  if (!match) return payload
  return match[1]
    .split(/, (?=\w+=)/)
    .map(pair => {
      const eq = pair.indexOf('=')
      const key = pair.slice(0, eq)
      const val = pair.slice(eq + 1)
      return `${key}: ${val}`
    })
    .join('\n')
}

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
        setEvents(Array.isArray(data) ? data : [])
      } catch (err) {
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
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={600}>
            Policy Event History
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/policies')}>
            Back to Policies
          </Button>
        </Box>

        <Typography>Policy ID: {id}</Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Payload</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No events found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                events.map((event, index) => (
                  <TableRow key={event.id}>
                    <TableCell>#{index + 1}</TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {formatPayload(event.payload)}
                      </Box>
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
