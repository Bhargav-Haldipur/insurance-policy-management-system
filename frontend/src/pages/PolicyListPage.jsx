import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import dayjs from 'dayjs'
import { getPolicies, deletePolicy, getApiErrorMessage } from '../services/policy_Service'
import { formatCoverageDate, formatTimestamp } from '../utils/dateFormat'

const TOTAL_COLS = 12

const EXPIRY_WARN_STATUSES = new Set(['ACTIVE', 'PENDING', 'SUSPENDED'])

function riskChipColor(score) {
  if (score === 'HIGH') return 'error'
  if (score === 'LOW') return 'success'
  return 'warning'
}

function formatAmountCompact(value) {
  if (value == null) return '—'
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function isExpiringSoon(coverageEndDate, status) {
  if (!coverageEndDate || !EXPIRY_WARN_STATUSES.has(status)) return false
  const end = dayjs(coverageEndDate)
  return end.isValid() && end.isAfter(dayjs()) && end.isBefore(dayjs().add(31, 'day'))
}

function PolicyListPage() {
  const [policies, setPolicies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDeletePolicy, setPendingDeletePolicy] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleDeleteClick = (policy) => {
    setPendingDeletePolicy({ id: policy.id, policyName: policy.policyName })
  }

  const handleDeleteCancel = () => {
    setPendingDeletePolicy(null)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await deletePolicy(pendingDeletePolicy.id)
      setPolicies((prev) => prev.filter((p) => p.id !== pendingDeletePolicy.id))
      setPendingDeletePolicy(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete policy.'))
      setPendingDeletePolicy(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
          <Table size="small" aria-label="insurance policies table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Policy Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Holder Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Coverage Start</TableCell>
                <TableCell>Coverage End</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell>Coverage</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={TOTAL_COLS} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && policies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={TOTAL_COLS} align="center">
                    No policies found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>{policy.id}</TableCell>
                    <TableCell>{policy.policyName}</TableCell>
                    <TableCell>{policy.policyType ?? '—'}</TableCell>
                    <TableCell>{policy.holderName ?? '—'}</TableCell>
                    <TableCell>{policy.status}</TableCell>
                    <TableCell>
                      {formatCoverageDate(policy.coverageStartDate)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{formatCoverageDate(policy.coverageEndDate)}</span>
                        {isExpiringSoon(policy.coverageEndDate, policy.status) && (
                          <Chip label="Expiring Soon" color="warning" size="small" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{formatAmountCompact(policy.premiumAmount)}</TableCell>
                    <TableCell>{formatAmountCompact(policy.coverageAmount)}</TableCell>
                    <TableCell>
                      {policy.riskScore
                        ? <Chip label={policy.riskScore} color={riskChipColor(policy.riskScore)} size="small" />
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {formatTimestamp(policy.createdAt)}
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          onClick={() => navigate(`/policies/view/${policy.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/policies/edit/${policy.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/policies/${policy.id}/events`)}
                        >
                          Events
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(policy)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Dialog open={Boolean(pendingDeletePolicy)} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Policy</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete policy{' '}
            <strong>{pendingDeletePolicy?.policyName}</strong> (ID:{' '}
            {pendingDeletePolicy?.id})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PolicyListPage
