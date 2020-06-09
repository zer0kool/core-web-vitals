import pandas as pd
import requests
import urllib
import time
import re


# Data Visualization
from plotly import tools
import chart_studio
chart_studio.tools.set_credentials_file(username='zer0dev', api_key='nMALhFaihf5xhdtqizvr')
import plotly.graph_objects as go
import chart_studio.plotly as py

#Load PageSpeed API Credentials
page_speed_key = "Your PageSpeed API Key"
check = "captchaResult"

### Load SEMRush API Credentials
#api_key = 'Your SEMRush API Key'
#rush_service_url = 'https://api.semrush.com'


service_url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed\/'
def speed_test(url, device, page_speed_key):
    path = '(\\\/)'
    params = {
        "?url": url,
        'strategy': device,
        'key': page_speed_key,
        }
    data = urllib.parse.urlencode(params, doseq=True)
    main_call = urllib.parse.urljoin(service_url, data)
    main_call = re.sub(path, '', main_call)
    main_call = main_call.replace(r'%3F', r'?')

    return main_call


#def pull_ranking_urls(phrase):
#    params = {
#        "?type": "phrase_organic",
#        'key': api_key,
#        'phrase': phrase,
#        'database': 'us',
#        'display_limit': '10'
#        }
#    data = urllib.parse.urlencode(params, doseq=True)
#    main_call = urllib.parse.urljoin(rush_service_url, data)
#    main_call = main_call.replace(r'%3F', r'?')
#
#    return main_call

def parse_response(call_data):
        results = []
        data = call_data.decode('unicode_escape')
        lines = data.split('\r\n')
        lines = list(filter(bool, lines))
        columns = lines[0].split(';')

        for line in lines[1:]:
            result = {}
            for i, datum in enumerate(line.split(';')):
                result[columns[i]] = datum.strip('"\n\r\t')
            results.append(result)

        return results


#rankings = pd.DataFrame(parse_response(requests.get(pull_ranking_urls(phrase='best summer shoes')).content))
rankings = 4

concat_frame = []
for test_url in rankings['Url']:
    call = requests.get(speed_test(url=test_url, device='mobile', key=key))
    response = call.json()
    if check in response:
        pass
    else:
        x = "Error Found with the following URL: %s" % (test_url), ", remove or revise"
    frame = []
    for i in response['loadingExperience']['metrics']:
        rating = ['FAST', 'AVERAGE', 'POOR']
        data = {
            'Category': i,
            'Ranking': response['loadingExperience']['metrics'][i]['category'],
            'Pencentile':response['loadingExperience']['metrics'][i]['percentile']
        }
        for label, num in zip(rating, response['loadingExperience']['metrics'][i]['distributions']):
            data[label] = round(num['proportion'], 2)
        frame.append(data)
    df = pd.DataFrame(frame)
    df['Url'] = test_url
    concat_frame.append(df)

final = pd.concat(concat_frame)
plot = final[final['Category'].str.contains('LARGEST_CONTENTFUL_PAINT_MS')].reset_index(drop=True)

plot = plot[['Url', 'FAST', 'AVERAGE', 'POOR']]
fig = go.Figure()
fig.add_trace(go.Bar(
    y=plot['Url'],
    x=plot['FAST'],
    name='FAST',
    orientation='h',
    marker=dict(
        color='rgba(2, 217, 70, 0.6)')))

fig.add_trace(go.Bar(
    y=plot['Url'],
    x=plot['AVERAGE'],
    name='AVERAGE',
    orientation='h',
    marker=dict(
        color='rgba(235, 208, 5, 0.6)')
    )
)

fig.add_trace(go.Bar(
    y=plot['Url'],
    x=plot['POOR'],
    name='POOR',
    orientation='h',
    marker=dict(
        color='rgba(242, 27, 12, 0.6)')
    )
)

fig.update_layout(
    title={
    'text': 'Core Web Vitals: Top URLs for "Best Summer Shoes"',
    'y':0.9,
    'x':0.5,
    'xanchor': 'center',
    'yanchor': 'top'},
    barmode='stack',
    width=1200,
    height=600,
)
py.plot(fig, filename='core_web_vitals')
