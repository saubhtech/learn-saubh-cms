import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

// FTP Configuration from environment variables
const FTP_CONFIG = {
  host: process.env.FTP_HOST || '72.61.234.190',
  port: Number(process.env.FTP_PORT) || 21,
  user: process.env.FTP_USER || 'u565881157.saubhtech',
  password: process.env.FTP_PASSWORD || 'Mani@Mala#1954',
  secure: false,
};

// Helper function to generate unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${cleanName}`;
}

// Helper function to convert File to Stream
async function fileToStream(file: File): Promise<Readable> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return Readable.from(buffer);
}

export async function POST(request: NextRequest) {
  const client = new ftp.Client();
  client.ftp.verbose = true; // Enable verbose logging for debugging
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max for audio/video, 10MB for docs)
    const isMedia = type?.includes('audio') || type?.includes('video');
    const maxSize = isMedia ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${isMedia ? '100MB' : '10MB'} limit` },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    const allowedTypes: { [key: string]: string[] } = {
      doc: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
      video: ['video/mp4', 'video/webm', 'video/ogg'],
      image: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
    };

    // Determine file category
    let category = 'doc';
    if (type?.includes('audio')) category = 'audio';
    else if (type?.includes('video')) category = 'video';
    else if (type?.includes('image') || file.type.startsWith('image/')) category = 'image';

    // Validate file type
    if (allowedTypes[category] && !allowedTypes[category].includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type for ${category}` },
        { status: 400 }
      );
    }

    console.log('🔗 Connecting to FTP server...');
    
    // Connect to FTP server
    await client.access(FTP_CONFIG);
    
    console.log('✅ Connected to FTP server');

    // Determine upload directory (root is /, not /public_html/)
    let uploadDir = '/uploads/';
    if (type?.includes('exam')) uploadDir += 'exams/';
    else if (type?.includes('subject')) uploadDir += 'subjects/';
    else if (type?.includes('unit')) uploadDir += 'units/';
    else if (type?.includes('lesson')) uploadDir += 'lessons/';
    else if (type?.includes('topic')) uploadDir += 'topics/';
    else if (type?.includes('mcq')) uploadDir += 'mcqs/';
    else if (type?.includes('question')) uploadDir += 'questions/';
    else uploadDir += 'documents/';

    console.log('📁 Creating directory:', uploadDir);

    // Create directory structure
    try {
      await client.ensureDir(uploadDir);
      console.log('✅ Directory ready');
    } catch (error) {
      console.error('❌ Directory creation error:', error);
      // Continue anyway, directory might already exist
    }

    // Generate filename and upload
    const filename = generateFileName(file.name);
    const remotePath = `${uploadDir}${filename}`;
    
    console.log('📤 Uploading file:', remotePath);

    const fileStream = await fileToStream(file);
    await client.uploadFrom(fileStream, remotePath);
    
    console.log('✅ File uploaded successfully');

    // Close connection
    client.close();

    // Generate public URL
    const folderName = type?.includes('exam') ? 'exams' : 
                       type?.includes('subject') ? 'subjects' :
                       type?.includes('unit') ? 'units' :
                       type?.includes('lesson') ? 'lessons' : 
                       type?.includes('topic') ? 'topics' :
                       type?.includes('mcq') ? 'mcqs' : 
                       type?.includes('question') ? 'questions' : 'documents';
    
    const publicUrl = `http://72.61.234.190/uploads/${folderName}/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrl,
      filename: filename,
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    client.close();
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'File upload failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Keep your existing GET method
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json(
      { success: false, error: 'Filename required' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    url: `/uploads/${filename}`,
  });
}

// Optional: Test connection endpoint
export async function HEAD() {
  const client = new ftp.Client();
  
  try {
    await client.access(FTP_CONFIG);
    const cwd = await client.pwd();
    client.close();
    
    return NextResponse.json({
      success: true,
      message: 'FTP connection successful',
      directory: cwd,
    });
  } catch (error: any) {
    client.close();
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}