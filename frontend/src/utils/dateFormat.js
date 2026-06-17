import dayjs from 'dayjs'

const COVERAGE_DATE_FORMAT = 'DD MMM YYYY'
const TIMESTAMP_FORMAT = 'DD MMM YYYY, hh:mm A'

const formatDate = (value, format) => {
  if (!value) {
    return '-'
  }

  const parsedDate = dayjs(value)
  return parsedDate.isValid() ? parsedDate.format(format) : '-'
}

export const formatCoverageDate = (value) => formatDate(value, COVERAGE_DATE_FORMAT)

export const formatTimestamp = (value) => formatDate(value, TIMESTAMP_FORMAT)

export const toApiDate = (value) => (value && value.isValid() ? value.format('YYYY-MM-DD') : '')
