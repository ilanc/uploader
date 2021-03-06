/**
 * Implement initialization.
 */
(function (Uploader, $) {

    "use strict";

    $.extend(Uploader.prototype, {

        /**
         * Init uploader instance.
         *
         * @param options
         */
        init: function(options) {

            // Merge the options with the default values.
            this.options = $.extend(true, {}, this.constructor.defaults, options);

            /**
             * Whether the current browser can be considered modern (in this case we consider a browser to be modern if
             * it supports XHR uploads, and `this.options.degrade` is not set to true.
             */
            this.isModernBrowser = this.constructor.support.xhrUpload && ! this.options.degrade;

            /**
             * All the files selected or drag & dropped by the user are added one by one to the file list (if they pass the validation).
             *
             * Each item in the file list is added with a unique key (generated by the `uniqueId` method), and has the
             * following properties:
             *
             *  - name:     the file's name
             *
             *  - file:     a File object for modern browsers supporting XHR uploads, and a jQuery object with
             *              a file input element for older browsers
             *
             *  - status:   STATUS_ADDED | STATUS_UPLOADING | STATUS_COMPLETED | STATUS_PENDING | STATUS_FAILED
             *
             *  - request:  an XHR object for modern browsers supporting XHR uploads, a jQuery object with an iFrame element
             *              for older browsers
             *
             *  - progress: information about the upload
             *
             *              NOTE! The `request` and `progress` properties doesn't exist until the file starts uploading.
             */
            this.fileList = {};

            /**
             * To not exceed the maximum allowed number of simultaneous uploads, some files are added to the pending list,
             * and wait until other files finish uploading.
             */
            this.pendingList = [];

            // Init the file count (this number must not exceed the `this.options.maxFiles` value).
            this.fileCount = 0;

            // Init the list of event listeners
            this.eventHandlers = {};

            // Init elements.
            this.initElements();
        },

        /**
         * Create and init elements.
         *
         * Because most of the browsers doesn't allow launching the file browser dialog from javascript, we must implement
         * the transparent input trick.
         *
         * Basically we place a transparent file input over the upload button. This way users will see the select button,
         * but will actually click the transparent file input, thus the file browser dialog will be opened.
         */
        initElements: function() {

            // Init the select button
            this.$selectButton = $(this.options.selectButton);

            // Create the transparent file input and append it to the select button
            this.createFileInput();

            // Init the drop zone
            if (this.options.dropZone && this.constructor.support.dropFiles && this.isModernBrowser) {
                this.initDropZone();
            }
        },

        /**
         * Create and init a new file input.
         */
        createFileInput: function() {

            if (this.options.existingInput) {
                this.$fileInput = $(this.options.existingInput);
            } else {
                // Create the file input
                this.$fileInput = $("<input/>", {
                    name: this.options.name,
                    accept: (this.options.acceptType || []).join(),
                    type: "file"
                }).appendTo(this.$selectButton);
            }

            // Set the multiple attribute
            if (this.options.multiple && this.constructor.support.selectMultiple && this.isModernBrowser) {
                this.$fileInput.attr("multiple", "multiple");
            }

            // Listen to file input's `onchange` event
            this.$fileInput.on("change", $.proxy(this.onFileSelect, this));
        },

        /**
         * Init drop zone.
         *
         * We register all the event handlers in the ".Uploader" namespace, so it will be easier to remove them later.
         */
        initDropZone: function() {
            this.$dropZone = $(this.options.dropZone);

            // On drag over
            this.$dropZone.on("dragover.Uploader", $.proxy(function(e) {
                e.preventDefault();
                this.$dropZone.addClass(this.options.cssClasses.dropZoneDragOver);

                return false;
            }, this));

            // On drag end
            this.$dropZone.on("dragend.Uploader", $.proxy(function(e) {
                e.preventDefault();
                this.$dropZone.removeClass(this.options.cssClasses.dropZoneDragOver);

                return false;
            }, this));

            // On drag leave
            this.$dropZone.on("dragleave.Uploader", $.proxy(function(e) {
                e.preventDefault();
                this.$dropZone.removeClass(this.options.cssClasses.dropZoneDragOver);

                return false;
            }, this));

            // On drop
            this.$dropZone.on("drop.Uploader", $.proxy(function(e) {
                e.preventDefault();
                this.$dropZone.removeClass(this.options.cssClasses.dropZoneDragOver);

                // Add the files to the file list
                if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) {
                    this.addToList(e.originalEvent.dataTransfer.files);
                }
            }, this));
        }
    });


}(window.Uploader, jQuery));
