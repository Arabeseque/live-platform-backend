import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Live Platform API',
    version: '1.0.0',
    description: '直播平台 API 文档',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '开发环境服务器'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{
    bearerAuth: []
  }]
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ['./src/controllers/*.ts', './src/routes/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);

// Swagger UI 配置
export const swaggerUiOptions = {
  routePrefix: '/swagger',
  swaggerOptions: {
    url: '/swagger-json',
    spec: swaggerSpec
  }
};
