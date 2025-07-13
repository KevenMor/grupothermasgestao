import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url');
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).send('Failed to fetch PDF');
    }
    res.setHeader('Content-Type', 'application/pdf');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch {
    res.status(500).send('Error fetching PDF');
  }
} 