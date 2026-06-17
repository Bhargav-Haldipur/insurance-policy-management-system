import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { getPolicies } from '../services/policy_Service'
import { formatCoverageDate, formatTimestamp } from '../utils/dateFormat'

function PolicyListPage() {
  const [policies, setPolicies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await getPolicies()
        setPolicies(data)
      } catch {
        setError('Unable to load policies.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicies()
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4" fontWeight={600}>
            Insurance Policies
          </Typography>

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/policies/create')}
          >
            Create Policy
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TableContainer component={Paper}>
          <Table aria-label="insurance policies table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Policy Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Coverage Start Date</TableCell>
                <TableCell>Coverage End Date</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && policies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No policies found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>{policy.id}</TableCell>
                    <TableCell>{policy.policyName}</TableCell>
                    <TableCell>{policy.status}</TableCell>
                    <TableCell>
                      {formatCoverageDate(policy.coverageStartDate)}
                    </TableCell>
                    <TableCell>
                      {formatCoverageDate(policy.coverageEndDate)}
                    </TableCell>
                    <TableCell>
                      {formatTimestamp(policy.createdAt)}
                    </TableCell>
                    <TableCell>
                      {formatTimestamp(policy.updatedAt)}
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="column"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(`/policies/view/${policy.id}`)
                          }
                        >
                          View Policy
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            navigate(`/policies/edit/${policy.id}`)
                          }
                        >
                          Edit Policy
                        </Button>

                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={() =>
                            navigate(`/policies/${policy.id}/events`)
                          }
                        >
                          View Events
                        </Button>
                      </Stack>
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

export default PolicyListPage