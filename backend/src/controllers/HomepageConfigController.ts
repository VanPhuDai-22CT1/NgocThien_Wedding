import { Request, Response } from 'express';
import { HomepageConfig } from '../models';

class HomepageConfigController {
  private parseJsonList(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  }

  private getUploadedPath(file: Express.Multer.File | undefined): string {
    if (!file) return '';
    return `uploads/${file.filename}`;
  }

  async getHomepageImages(req: Request, res: Response) {
    try {
      const config = await HomepageConfig.findByPk(1);

      if (!config) {
        return res.json({
          success: true,
          data: {
            galleryImages: [],
            consultImage: '',
            headerSliderImages: [],
            heroBackgroundImage: '',
            imageHistory: {
              gallery: [[], [], [], [], [], [], []],
              consult: [],
              headerSlider: [[], [], []],
              heroBackground: [],
            },
          },
        });
      }

      const imageHistory = this.parseJsonList((config as any).image_history);
      let parsedHistory: any = {
        gallery: [[], [], [], [], [], [], []],
        consult: [],
        headerSlider: [[], [], []],
        heroBackground: [],
      };

      try {
        const raw = (config as any).image_history;
        if (raw) {
          parsedHistory = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
      } catch {
        // Keep default history structure.
      }

      res.json({
        success: true,
        data: {
          galleryImages: this.parseJsonList((config as any).gallery_images),
          consultImage: (config as any).consult_image || '',
          headerSliderImages: this.parseJsonList((config as any).header_slider_images),
          heroBackgroundImage: (config as any).hero_background_image || '',
          imageHistory: parsedHistory,
          updatedAt: (config as any).updated_at,
          legacyImageHistory: imageHistory,
        },
      });
    } catch (error) {
      console.error('Get homepage images error:', error);
      res.status(500).json({ success: false, message: 'Failed to load homepage images' });
    }
  }

  async saveHomepageImages(req: Request, res: Response) {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const uploaded = (field: string) => this.getUploadedPath(files?.[field]?.[0]);

      const existing = await HomepageConfig.findByPk(1);

      const galleryImages = Array.from({ length: 7 }, (_, idx) => {
        const filePath = uploaded(`gallery_${idx + 1}`);
        const pathOverride = String((req.body as any)[`gallery_path_${idx + 1}`] || '').trim();
        if (filePath) return filePath;
        if (pathOverride) return pathOverride;

        const current = existing ? this.parseJsonList((existing as any).gallery_images) : [];
        return current[idx] || '';
      });

      const headerSliderImages = Array.from({ length: 3 }, (_, idx) => {
        const filePath = uploaded(`header_${idx + 1}`);
        const pathOverride = String((req.body as any)[`header_path_${idx + 1}`] || '').trim();
        if (filePath) return filePath;
        if (pathOverride) return pathOverride;

        const current = existing ? this.parseJsonList((existing as any).header_slider_images) : [];
        return current[idx] || '';
      });

      const consultFile = uploaded('consult_image');
      const consultOverride = String((req.body as any).consult_path || '').trim();
      const consultImage = consultFile || consultOverride || (existing as any)?.consult_image || '';

      const heroFile = uploaded('hero_background');
      const heroOverride = String((req.body as any).hero_background_path || '').trim();
      const heroBackgroundImage = heroFile || heroOverride || (existing as any)?.hero_background_image || '';

      const currentHistory = existing ? ((existing as any).image_history || {}) : {};
      const history = {
        gallery: Array.from({ length: 7 }, (_, idx) => {
          const prev = Array.isArray(currentHistory?.gallery?.[idx]) ? currentHistory.gallery[idx] : [];
          const next = galleryImages[idx];
          return next && !prev.includes(next) ? [next, ...prev].slice(0, 10) : prev;
        }),
        consult: (() => {
          const prev = Array.isArray(currentHistory?.consult) ? currentHistory.consult : [];
          return consultImage && !prev.includes(consultImage)
            ? [consultImage, ...prev].slice(0, 10)
            : prev;
        })(),
        headerSlider: Array.from({ length: 3 }, (_, idx) => {
          const prev = Array.isArray(currentHistory?.headerSlider?.[idx]) ? currentHistory.headerSlider[idx] : [];
          const next = headerSliderImages[idx];
          return next && !prev.includes(next) ? [next, ...prev].slice(0, 10) : prev;
        }),
        heroBackground: (() => {
          const prev = Array.isArray(currentHistory?.heroBackground) ? currentHistory.heroBackground : [];
          return heroBackgroundImage && !prev.includes(heroBackgroundImage)
            ? [heroBackgroundImage, ...prev].slice(0, 10)
            : prev;
        })(),
      };

      const payload = {
        id: 1,
        gallery_images: galleryImages,
        header_slider_images: headerSliderImages,
        consult_image: consultImage,
        hero_background_image: heroBackgroundImage,
        image_history: history,
        updated_at: new Date(),
      };

      if (!existing) {
        await HomepageConfig.create(payload as any);
      } else {
        await existing.update(payload as any);
      }

      res.json({ success: true, message: 'Homepage images saved' });
    } catch (error) {
      console.error('Save homepage images error:', error);
      res.status(500).json({ success: false, message: 'Failed to save homepage images' });
    }
  }
}

export default new HomepageConfigController();
