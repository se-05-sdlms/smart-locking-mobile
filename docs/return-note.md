# Return request note

The resident must provide a nonblank note when creating a return request
(backend issue223). The form validates the trimmed note before image upload or
request creation. It shows an alert on the note field and retains the existing
200-character input limit. The API wrapper also rejects blank notes and sends
the trimmed value.

Upload or create failures retain the photo and typed note. A retry reuses an
already uploaded image, while a failed upload is retried. This validation does
not impose a new backend maximum length or change allocation/open-door behavior.
