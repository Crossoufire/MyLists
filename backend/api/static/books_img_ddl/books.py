"""
Extension of the Google API for books.
Allow the fetching of books cover from Google images.
Taken and simplified from: https://github.com/Joeclinton1/google-images-download
"""

import http.client
import json
import os
import secrets
import sys
import time
import urllib.request
from urllib.parse import quote
from urllib.request import Request, urlopen


# Parameters
http.client._MAXHEADERS = 1000
ARGS_LIST = ["keywords", "output_directory", "limit", "size", "aspect_ratio", "format"]


class GoogleImages:
    """ Google image class to fetch cover for books """

    def __init__(self):
        pass

    @staticmethod
    def _extract_data_pack(page):
        start_line = page.find("AF_initDataCallback({key: \\'ds:1\\'") - 10
        start_object = page.find('[', start_line + 1)
        end_object = page.rfind(']', 0, page.find("</script>", start_object + 1)) + 1
        object_raw = str(page[start_object:end_object])

        return bytes(object_raw, "utf-8").decode("unicode_escape")

    @staticmethod
    def _image_objects_from_pack(data):
        image_objects = json.loads(data)[31][-1][12][2]

        return [x for x in image_objects if x[0] == 1]

    @staticmethod
    def get_next_tab(s):
        start_line = s.find('class="dtviD"')

        # If no links are found then give an error!
        if start_line == -1:
            return None, None, None
        else:
            start_line = s.find('class="dtviD"')
            start_content = s.find('href="', start_line + 1)
            end_content = s.find('">', start_content + 1)
            url_item = "https://www.google.com" + str(s[start_content + 6:end_content])
            url_item = url_item.replace('&amp;', '&')

            start_line_2 = s.find('class="dtviD"')
            s = s.replace('&amp;', '&')
            start_content_2 = s.find(':', start_line_2 + 1)
            end_content_2 = s.find('&usg=', start_content_2 + 1)
            url_item_name = str(s[start_content_2 + 1:end_content_2])

            chars = url_item_name.find(',g_1:')
            chars_end = url_item_name.find(":", chars + 6)
            if chars_end == -1:
                updated_item_name = (url_item_name[chars + 5:]).replace("+", " ")
            else:
                updated_item_name = (url_item_name[chars + 5:chars_end]).replace("+", " ")

            return url_item, updated_item_name, end_content

    @staticmethod
    def format_object(object_):
        data = object_[1]
        main = data[3]

        info = data[9]
        if info is None:
            info = data[11]

        formatted_object = {}
        try:
            formatted_object['image_height'] = main[2]
            formatted_object['image_width'] = main[1]
            formatted_object['image_link'] = main[0]
            formatted_object['image_format'] = main[0][-1 * (len(main[0]) - main[0].rfind(".") - 1):]
            formatted_object['image_description'] = info['2003'][3]
            formatted_object['image_host'] = info['2003'][17]
            formatted_object['image_source'] = info['2003'][2]
            formatted_object['image_thumbnail_url'] = data[2][0]
        except Exception as e:
            print(e)
            return None

        return formatted_object

    @staticmethod
    def build_url_parameters(arguments):
        params = {'size': [arguments['size'], {'large': 'isz:l', 'medium': 'isz:m', 'icon': 'isz:i',
                                               '>400*300': 'isz:lt,islt:qsvga', '>640*480': 'isz:lt,islt:vga',
                                               '>800*600': 'isz:lt,islt:svga', '>1024*768': 'visz:lt,islt:xga',
                                               '>2MP': 'isz:lt,islt:2mp', '>4MP': 'isz:lt,islt:4mp',
                                               '>6MP': 'isz:lt,islt:6mp', '>8MP': 'isz:lt,islt:8mp',
                                               '>10MP': 'isz:lt,islt:10mp', '>12MP': 'isz:lt,islt:12mp',
                                               '>15MP': 'isz:lt,islt:15mp', '>20MP': 'isz:lt,islt:20mp',
                                               '>40MP': 'isz:lt,islt:40mp', '>70MP': 'isz:lt,islt:70mp'}],
                  'aspect_ratio': [arguments['aspect_ratio'], {'tall': 'iar:t', 'square': 'iar:s', 'wide': 'iar:w',
                                                               'panoramic': 'iar:xw'}],
                  'format': [arguments['format'], {'jpg': 'ift:jpg', 'gif': 'ift:gif', 'png': 'ift:png',
                                                   'bmp': 'ift:bmp', 'svg': 'ift:svg', 'webp': 'webp',
                                                   'ico': 'ift:ico', 'raw': 'ift:craw'}]}

        counter = 0
        built_url = "&tbs="
        for key, value in params.items():
            if value[0] is not None:
                ext_param = value[1][value[0]]
                if counter == 0:
                    built_url = built_url + ext_param
                    counter = 1
                else:
                    built_url = built_url + ',' + ext_param

        return built_url

    @staticmethod
    def build_search_url(search_term, params):
        url = f'https://www.google.com/search?q={quote(search_term.encode("utf-8"))}&espv=2&biw=1366&bih=667' \
              f'&site=webhp&source=lnms&tbm=isch{params}&sa=X&ei=XosDVaCXD8TasATItgE&ved=0CAcQ_AUoAg'

        return url

    @staticmethod
    def download_image(image_url, main_directory):
        try:
            headers = {"User-Agent": "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.17 (KHTML, like Gecko) "
                                     "Chrome/24.0.1312.27 Safari/537.17"}
            req = Request(image_url, headers=headers)
            try:
                response = urlopen(req, timeout=10)
                data = response.read()
                info = response.info()
                response.close()

                qmark = image_url.rfind('?')
                if qmark == -1:
                    qmark = len(image_url)
                slash = image_url.rfind('/', 0, qmark) + 1
                image_name = str(image_url[slash:qmark]).lower()

                type_ = info.get_content_type()
                if type_ == "image/jpeg" or type_ == "image/jpg":
                    if not image_name.endswith(".jpg") and not image_name.endswith(".jpeg"):
                        image_name += ".jpg"
                elif type_ == "image/png":
                    if not image_name.endswith(".png"):
                        image_name += ".png"
                elif type_ == "image/webp":
                    if not image_name.endswith(".webp"):
                        image_name += ".webp"
                elif type_ == "image/gif":
                    if not image_name.endswith(".gif"):
                        image_name += ".gif"
                elif type_ == "image/bmp" or type_ == "image/x-windows-bmp":
                    if not image_name.endswith(".bmp"):
                        image_name += ".bmp"
                elif type_ == "image/x-icon" or type_ == "image/vnd.microsoft.icon":
                    if not image_name.endswith(".ico"):
                        image_name += ".ico"
                elif type_ == "image/svg+xml":
                    if not image_name.endswith(".svg"):
                        image_name += ".svg"
                else:
                    return "fail", f"Skipping this invalid image format: {type_}.", "", ""

                # Change the image name and create the path
                extension = os.path.splitext(image_name)[1]
                image_name = secrets.token_hex(8) + extension
                path = main_directory + "/" + image_name
                try:
                    output_file = open(path, 'wb')
                    output_file.write(data)
                    output_file.close()
                    download_status = 'success'
                    download_message = "Completed image ====> " + image_name
                    return_image_name = image_name
                    absolute_path = path
                except Exception as e:
                    download_status = 'fail'
                    download_message = f"Error: {str(e)}. Trying next one."
                    return_image_name = ''
                    absolute_path = ''
            except Exception as e:
                download_status = 'fail'
                download_message = f"Error: {str(e)}. Trying next one."
                return_image_name = ''
                absolute_path = ''
        except Exception as e:
            download_status = 'fail'
            download_message = f"Error: {str(e)}. Trying next one."
            return_image_name = ''
            absolute_path = ''

        return download_status, download_message, return_image_name, absolute_path

    def _get_all_items(self, image_objects, main_directory, limit):
        items, abs_path = [], []
        errorCount, i, count = 0, 0, 1
        while count < limit + 1 and i < len(image_objects):
            if len(image_objects) == 0:
                print("no_links")
                break
            else:
                obj = self.format_object(image_objects[i])
                ddl_status, ddl_message, image_name, path = self.download_image(obj['image_link'], main_directory)
                if ddl_status == "success":
                    count += 1
                    obj['image_filename'] = image_name
                    items.append(obj)
                    abs_path.append(path)
                else:
                    print(ddl_message)
                    errorCount += 1
            i += 1

        if count < limit:
            print(f"\n\nUnfortunately all {str(limit)} could not be downloaded because some images "
                  f"were not downloadable. {str(count - 1)} is all we got for this search filter.")

        return items, errorCount, abs_path

    def download_page(self, search_url):
        headers = {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                                 "Chrome/88.0.4324.104 Safari/537.36"}
        try:
            req = urllib.request.Request(search_url, headers=headers)
            resp = urllib.request.urlopen(req)
            respData = str(resp.read())
        except:
            sys.exit()

        try:
            return self._image_objects_from_pack(self._extract_data_pack(respData)), self.get_all_tabs(respData)
        except Exception as e:
            print(e)
            print("Image objects data unpacking failed. Please leave a comment with the above error at "
                  "https://github.com/hardikvasa/google-images-download/pull/298")
            sys.exit()

    def get_all_tabs(self, page):
        tabs = {}
        while True:
            item, item_name, end_content = self.get_next_tab(page)
            if item is None:
                break
            else:
                if len(item_name) > 100 or item_name == "background-color":
                    break
                else:
                    # Append all the links in the list named 'Links'
                    tabs[item_name] = item
                    # Timer to slow down the request for image downloads
                    time.sleep(0.1)
                    page = page[end_content:]

        return tabs

    def download(self, arguments):
        paths, errors = self.download_executor(arguments)

        return paths, errors

    def download_executor(self, arguments):
        paths, total_errors = {}, 0
        for arg in ARGS_LIST:
            if arg not in arguments:
                arguments[arg] = None

        search_keyword = arguments['keywords']
        main_directory = arguments['output_directory']

        limit = 1
        if arguments['limit']:
            limit = int(arguments['limit'])

        url_params = self.build_url_parameters(arguments)
        search_url = self.build_search_url(search_keyword, url_params)
        images, tabs = self.download_page(search_url)
        items, errorCount, abs_path = self._get_all_items(images, main_directory, limit)
        paths['image'] = abs_path
        total_errors += errorCount

        return paths, total_errors
