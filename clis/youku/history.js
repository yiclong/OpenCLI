import { cli } from '@jackwener/opencli/registry';

cli({
    site: 'youku',
    name: 'history',
    description: '获取优酷播放历史记录',
    domain: 'www.youku.com',
    args: [
        { name: 'limit', type: 'int', default: 10, help: '返回结果数量' },
    ],
    columns: ['rank', 'title', 'url', 'progress'],
    pipeline: [
        { navigate: 'https://www.youku.com/ku/usc/index' },
        { evaluate: `(async () => {
            await new Promise(r => setTimeout(r, 5000));
            
            const results = [];
            const links = document.querySelectorAll('a[href*="video"], a[href*="v_show"]');
            
            links.forEach((link) => {
                const href = link.href;
                const rawTitle = link.getAttribute('title') || 
                              link.querySelector('img')?.getAttribute('alt') ||
                              link.textContent?.trim() || '';
                
                const vidMatch = href.match(/vid=([A-Za-z0-9]+)/);
                const vid = vidMatch ? vidMatch[1] : '';
                
                let title = rawTitle.replace(/\\s+/g, ' ').trim();
                
                const progressMatch = title.match(/观看至(\\d+%|不足1%)|已看完/);
                const progress = progressMatch ? progressMatch[0] : '';
                
                title = title
                    .replace(/^(独播|帧享|日掛|VIP|\\d+话全|\\d+集全)+/g, '')
                    .replace(/第\\d+集/g, '')
                    .replace(/\\d+集全/g, '')
                    .replace(/(手机|电脑|TV版|观)?\\s*(观看至\\d+%|观看不足1%|已看完|观看)/g, '')
                    .replace(/\\s+/g, ' ')
                    .trim();
                
                if (href.includes('youku.com/v') && title.length > 2) {
                    results.push({
                        title: title.substring(0, 50),
                        url: href.split('?')[0] + (vid ? '?vid=' + vid : ''),
                        progress: progress
                    });
                }
            });
            
            return results;
        })()` },
        { map: {
            rank: '${{ index + 1 }}',
            title: '${{ item.title }}',
            url: '${{ item.url }}',
            progress: '${{ item.progress }}',
        } },
        { limit: '${{ args.limit }}' },
    ],
});