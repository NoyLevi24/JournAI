import { Router } from 'express';
import multer from 'multer';
import { all, run, get } from '../storage/db.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadToS3, getSignedUrlForFile, deleteFromS3 } from '../services/s3.js';

const router = Router();

// Configure multer to handle file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  },
});

/**
 * Get all photos for an itinerary
 */
router.get('/:itineraryId', requireAuth, async (req, res) => {
  try {
    const photos = await all(
      'SELECT * FROM photos WHERE itinerary_id = ? AND user_id = ? ORDER BY created_at DESC',
      [req.params.itineraryId, req.userId]
    );

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          const url = await getSignedUrlForFile(photo.filename);
          return { ...photo, url };
        } catch (error) {
          console.error(`Error generating URL for photo ${photo.id}:`, error);
          return { ...photo, url: null, error: 'Failed to generate URL' };
        }
      })
    );

    res.json(photosWithUrls);
  } catch (error) {
    console.error('Error getting photos:', error);
    res.status(500).json({ error: 'Failed to retrieve photos' });
  }
});

/**
 * Upload a new photo
 */
router.post(
  '/:itineraryId',
  requireAuth,
  upload.single('photo'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const { caption, title, takenAt, location, tags, albumId } = req.body;
      
      // Upload to S3
      const s3Key = await uploadToS3(
        req.file,
        `users/${req.userId}/itineraries/${req.params.itineraryId}/`
      );

      // Save to database
      const result = await run(
        `INSERT INTO photos 
         (itinerary_id, user_id, filename, caption, title, taken_at, location, tags, album_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        [
          req.params.itineraryId,
          req.userId,
          s3Key, // Store S3 key as filename
          caption || null,
          title || null,
          takenAt || null,
          location || null,
          tags ? JSON.stringify(tags) : null,
          albumId || null,
        ]
      );

      // Get the created photo with signed URL
      const photo = await get('SELECT * FROM photos WHERE id = ?', [result.lastID]);
      const url = await getSignedUrlForFile(photo.filename);
      
      res.status(201).json({ ...photo, url });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ 
        error: 'Failed to upload photo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * Update photo metadata
 */
router.put('/:photoId', requireAuth, async (req, res) => {
  const { title, caption, takenAt, location, tags, albumId } = req.body || {};
  
  try {
    // Verify the photo exists and belongs to the user
    const photo = await get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [
      req.params.photoId,
      req.userId,
    ]);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Update the photo metadata
    await run(
      `UPDATE photos 
       SET title = COALESCE(?, title), 
           caption = COALESCE(?, caption), 
           taken_at = COALESCE(?, taken_at), 
           location = COALESCE(?, location), 
           tags = COALESCE(?, tags), 
           album_id = COALESCE(?, album_id) 
       WHERE id = ?`,
      [
        title || null,
        caption || null,
        takenAt || null,
        location || null,
        tags ? JSON.stringify(tags) : null,
        albumId || null,
        req.params.photoId,
      ]
    );

    // Return the updated photo with a fresh signed URL
    const updatedPhoto = await get('SELECT * FROM photos WHERE id = ?', [req.params.photoId]);
    const url = await getSignedUrlForFile(updatedPhoto.filename);
    
    res.json({ ...updatedPhoto, url });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

/**
 * Delete a photo
 */
router.delete('/:photoId', requireAuth, async (req, res) => {
  try {
    // Get the photo first to get the S3 key
    const photo = await get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [
      req.params.photoId,
      req.userId,
    ]);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from S3
    await deleteFromS3(photo.filename);

    // Delete from database
    await run('DELETE FROM photos WHERE id = ? AND user_id = ?', [
      req.params.photoId,
      req.userId,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router
