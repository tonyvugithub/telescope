const request = require('supertest');
const nock = require('nock');
const createError = require('http-errors');
const { app } = require('../src');
const { checkValidUrl, checkValidBlogPage, discoverFeedUrls } = require('../src/lib');

describe('POST /', () => {
  afterAll(() => {
    nock.cleanAll();
  });
  describe('Test checkValidUrl middleware', () => {
    it('should return 400 status if the url has invalid format', (done) => {
      const invalidUrl = 'invalidLink.com';
      const mockReq = {
        body: {
          blogUrl: invalidUrl,
        },
      };
      const mockRes = {};
      const mockNextFunction = jest.fn();
      checkValidUrl(mockReq, mockRes, mockNextFunction);
      const expectedError = createError(400, 'Invalid Blog URL');

      // Expect the next() function to be called with the expected error
      expect(mockNextFunction).toBeCalledWith(expectedError);

      request(app)
        .post('/')
        .send({ blogUrl: invalidUrl })
        // Expect to receive 400 status and expected response body
        .expect(400, '<h1>400 Error</h1><p>Invalid Blog URL</p>', done);
    });

    it('should call next() if the url has valid format', (done) => {
      const validUrl = 'https://validLink.com';
      const mockReq = {
        body: {
          blogUrl: validUrl,
        },
      };
      const mockRes = {};
      const mockNextFunction = jest.fn();
      checkValidUrl(mockReq, mockRes, mockNextFunction);
      expect(mockNextFunction).toHaveBeenCalledTimes(1);
      done();
    });
  });

  describe('Test checkValidBlogPage middleware', () => {
    it('should return 400 if the blog page responses with code other than 200', (done) => {
      const InvalidBlogPage = 'https://notExistBlogPage.com/';

      nock(InvalidBlogPage).get('/').reply(404);

      request(app).post('/').send({ blogUrl: InvalidBlogPage }).expect(400, done);
    });

    it('should return 400 if the blog page responses with content type other than text/html', (done) => {
      const InvalidBlogPage = 'https://notHtmlResponse.com/';

      nock(InvalidBlogPage).get('/').reply(200, null, {
        'Content-Type': 'text/xml',
      });

      request(app).post('/').send({ blogUrl: InvalidBlogPage }).expect(400, done);
    });
  });

  describe('Test discoverFeedUrls middleware', () => {
    it('should return 404 if there is no feed url discovered', (done) => {
      const validUrl = 'https://LinkWithNoFeedUrls.com';
      const mockBody = `
      <html>
        <head></head>
        <body></body>
      </html>
    `;
      const mockReq = {
        body: {
          blogUrl: validUrl,
        },
      };
      const mockRes = {
        locals: {
          document: mockBody,
        },
      };
      const mockNextFunction = jest.fn();
      discoverFeedUrls(mockReq, mockRes, mockNextFunction);
      const expectedError = createError(createError(404, 'No Feed Url Discovered'));
      expect(mockNextFunction).toBeCalledWith(expectedError);
      done();
    });

    it('should call next() if there is any discovered feed url', (done) => {
      const validUrl = 'https://LinkWithFeedUrls.com';
      const mockBody = `
      <html>
        <head>
          <link rel="alternate" type="application/rss+xml" href="https://validBlog.com/feed"/>
        </head>
        <body></body>
      </html>
    `;
      const mockReq = {
        body: {
          blogUrl: validUrl,
        },
      };
      const mockRes = {
        locals: {
          document: mockBody,
        },
      };
      const mockNextFunction = jest.fn();
      discoverFeedUrls(mockReq, mockRes, mockNextFunction);
      expect(mockNextFunction).toHaveBeenCalledTimes(1);
      expect(mockRes.locals.feedUrls).toEqual(['https://validBlog.com/feed']);
      done();
    });
  });

  it('should return 200 status and if all middlewares got passed', async (done) => {
    const blogUrl = 'https://test321.blogspot.com/';
    const mockBlogUrlResponseBody = `
      <!doctype html>
      <html lang="en">
        <head>
          <link rel="alternate" type="application/atom+xml" href="https://test321.blogspot.com/feeds/posts/default/-/open-source"/>
          <link rel="alternate" type="application/rss+xml" href="https://test321.blogspot.com/feeds/posts/default/-/open-source?alt=rss"/>
        </head>
        <body></body>
      </html>
    `;

    const result = {
      feedUrls: [
        'https://test321.blogspot.com/feeds/posts/default/-/open-source',
        'https://test321.blogspot.com/feeds/posts/default/-/open-source?alt=rss',
      ],
    };

    // Mocking the response body html when call GET request to blog url
    nock(blogUrl).get('/').reply(200, mockBlogUrlResponseBody, {
      'Content-Type': 'text/html',
    });

    const res = await request(app).post('/').send({ blogUrl });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(result);
    done();
  });
});
