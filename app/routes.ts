import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', 'routes/auth.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/jobs', 'routes/jobs.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
    route('/api/linkedin-extract', 'routes/api.linkedin-extract.tsx'),
] satisfies RouteConfig;
