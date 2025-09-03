// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit } from '../../lib/withRateLimit'

type Data = {
  name: string
}

function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ name: 'John Doe' })
}

// Apply rate limiting: 50 requests per minute per IP
export default withRateLimit(handler, { 
  limit: 50, 
  windowMs: 60000 
});
