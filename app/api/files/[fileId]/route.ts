import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedDownloader } from '@/lib/downloadAccess'

function pdfThumbUrl(url: string) {
  return url.replace('/upload/', '/upload/w_400,h_280,c_fill,pg_1,f_jpg/')
}

function imgThumbUrl(url: string) {
  return url.replace('/upload/', '/upload/w_400,h_280,c_fill,f_auto,q_auto/')
}

function getExtension(name: string) {
  const i = name.lastIndexOf('.')
  return i !== -1 ? name.slice(i) : ''
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  const mode = request.nextUrl.searchParams.get('mode') ?? 'view' // 'thumb' | 'view' | 'download'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: file, error } = await supabase
    .from('files')
    .select('file_url, original_name, name, mime_type')
    .eq('id', fileId)
    .single()

  if (error || !file) {
    return new Response('Not found', { status: 404 })
  }

  if (mode === 'download' && !(await isAuthorizedDownloader(supabase, user.id))) {
    return new Response('You do not have permission to download this file.', { status: 403 })
  }

  let sourceUrl = file.file_url
  if (mode === 'thumb') {
    sourceUrl = file.mime_type === 'application/pdf' ? pdfThumbUrl(sourceUrl) : imgThumbUrl(sourceUrl)
  }

  const upstream = await fetch(sourceUrl)
  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to fetch file', { status: 502 })
  }

  const filename = `${file.name}${getExtension(file.original_name)}`.replace(/"/g, '')
  const disposition = mode === 'download' ? 'attachment' : 'inline'
  const contentType = mode === 'thumb' ? (upstream.headers.get('content-type') ?? 'image/jpeg') : file.mime_type

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
