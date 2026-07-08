import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { getPolicy } from '../services/policy_Service'
import { formatCoverageDate, formatTimestamp } from '../utils/dateFormat'

function formatAmount(value) {
  if (value == null) return '—'
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ViewPolicyPage() {
  const [policy, setPolicy] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await getPolicy(id)
        setPolicy(data)
      } catch {
        setError('Unable to load policy.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicy()
  }, [id])

  const detailRows = policy
    ? [
        ['ID', policy.id],
        ['Policy Name', policy.policyName],
        ['Policy Type', policy.policyType ?? '—'],
        ['Status', policy.status],
        ['Holder Name', policy.holderName ?? '—'],
        ['Holder Email', policy.holderEmail ?? '—'],
        ['Holder Phone', policy.holderPhone ?? '—'],
        ['Premium Amount', formatAmount(policy.premiumAmount)],
        ['Coverage Amount', formatAmount(policy.coverageAmount)],
        ['Deductible', formatAmount(policy.deductible)],
        ['Coverage Start Date', formatCoverageDate(policy.coverageStartDate)],
        ['Coverage End Date', formatCoverageDate(policy.coverageEndDate)],
        ['Created At', formatTimestamp(policy.createdAt)],
        ['Updated At', formatTimestamp(policy.updatedAt)],
      ]
    : []

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4" fontWeight={600}>
            Policy Details
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <CardContent>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Stack divider={<Divider />} spacing={0}>
                {detailRows.map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: '180px 1fr',
                      py: 1.5,
                    }}
                  >
                    <Typography color="text.secondary">{label}</Typography>
                    <Typography>{value ?? '—'}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={() => navigate('/policies')}>Back</Button>
          <Button
            variant="contained"
            onClick={() => navigate(`/policies/edit/${id}`)}
          >
            Edit
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}

export default ViewPolicyPage
